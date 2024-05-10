import { minutesBeforeCycleStart, schedulerCronPattern } from '../constants';
import { CronJob } from 'cron';
import { bot } from '../app';

import { Group, Cycle } from '../schemas';
import moment from 'moment-timezone';
import { extractCycles, timeToMinutes } from '../utils';
import { getDisableKeyboard } from '../keyboards';

export const scheduleJob = async () => {
  try {
    const groups = await Group.find();
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];

      //* Validate Permissions
      const botInfo = await bot.botInfo;
      const botMembership = await bot.api.getChatMember(
        group.chatId as number,
        botInfo.id
      );

      if (
        botMembership.status !== 'administrator' &&
        botMembership.status !== 'creator'
      )
        return;

      if (!group.config) continue;

      //? get locale times
      const localeDate = moment().utcOffset(group.config.timezoneOffset);
      const time = `${
        localeDate.hours() < 10 ? '0' : ''
      }${localeDate.hours()}:${
        localeDate.minutes() < 10 ? '0' : ''
      }${localeDate.minutes()}`;
      const seconds = localeDate.seconds();

      //* Should Manage
      if (!group.enabled) continue;
      const today = localeDate.format('ddd').toLowerCase();
      if (!group.config.days.includes(today)) continue;

      //* Manage Cycles Start & Stop
      for (let i = 0; i < group.config.sessionPeriods.length; i++) {
        const session = group.config.sessionPeriods[i];
        if (
          timeToMinutes(session.start) - minutesBeforeCycleStart ===
            timeToMinutes(time) &&
          seconds < 2
        ) {
          //? 5 minutes before starting cycle
          await bot.api.sendMessage(
            group.chatId as number,
            `It's ${minutesBeforeCycleStart} minutes before starting the cycle. Get ready for focus time!`,
            {
              reply_markup: getDisableKeyboard(),
            }
          );
        } else if (time >= session.start && time <= session.end) {
          const exist = await Cycle.findOne({ group: group._id });
          if (!exist) {
            await Cycle.create({
              group: group._id,
              currentSlotIndex: 0,
              lastSlotStart: new Date(),
              slots: extractCycles(group.config.focusRestCycles),
            });

            //? close chat
            await bot.api.sendMessage(
              group.chatId as number,
              'Time cycle has been started, go and have fun with your works!',
              {
                reply_markup: getDisableKeyboard(),
              }
            );

            toggleChat(group.chatId as number, false);
          }
        } else if (session.end <= time) {
          if (
            !group.config.sessionPeriods[i + 1] ||
            group.config.sessionPeriods[i + 1]?.start > time
          ) {
            const exist = await Cycle.findOne({ group: group._id });
            if (exist) {
              await Cycle.deleteMany({ group: group._id });

              //? open chat
              toggleChat(group.chatId as number, true);

              await bot.api.sendMessage(
                group.chatId as number,
                "Congratulation🥳. Cycle has been finished successfully, let's have a deep rest!"
              );
            }
          }
        }
      }

      //* Manage Cycle Slots
      const cycle = await Cycle.findOne({ group: group._id });
      if (cycle) {
        //? get current slot
        const currentSlot = cycle.slots[cycle.currentSlotIndex];
        if (!currentSlot) continue;

        //? get now and where this slot gonna ends dates
        const now = new Date();
        const currentSlotStart = new Date(cycle.lastSlotStart as Date);
        currentSlotStart.setMinutes(
          currentSlotStart.getMinutes() + currentSlot
        );

        const isFocusTime = cycle.currentSlotIndex % 2 === 0;
        if (isFocusTime) {
          toggleChat(group.chatId as number, false);
        }

        if (now >= currentSlotStart) {
          const wasFocusedTime = cycle.currentSlotIndex % 2 === 0;

          //? seek to next slot
          cycle.currentSlotIndex =
            cycle.slots.length === cycle.currentSlotIndex + 1
              ? 0
              : cycle.currentSlotIndex + 1;
          cycle.lastSlotStart = currentSlotStart;
          await cycle.save();

          const group = await Group.findById(cycle.group);
          if (group) {
            if (wasFocusedTime) {
              //? rest time
              toggleChat(group.chatId as number, true);
              await bot.api.sendMessage(
                group.chatId as number,
                "Rest time 😌! let's take a rest and prepare yourself for next focus time.",
                {
                  reply_markup: getDisableKeyboard(),
                }
              );
            } else {
              //? focus time
              await bot.api.sendMessage(
                group.chatId as number,
                "Focus time 🤫! let's back again to your tasks.",
                {
                  reply_markup: getDisableKeyboard(),
                }
              );
              toggleChat(group.chatId as number, false);
            }
          }
        }
      }
    }
  } catch (error: any) {
    if (error?.parameters?.migrate_to_chat_id) {
      const exist = await Group.findOne({
        chatId: error.parameters.migrate_to_chat_id,
      });
      if (exist) {
        if (!exist.config) {
          const oldGroup = await Group.findOne({
            chatId: error.payload.chat_id,
          });
          exist.config = oldGroup?.config;
          await exist.save();
        }
        await Group.deleteOne({ chatId: error.payload.chat_id });
      } else
        await Group.updateOne(
          { chatId: error.payload.chat_id },
          { chatId: error.parameters.migrate_to_chat_id }
        );
    } else if (!error?.payload) console.error(error);
  }
};

export const schedulerCron = new CronJob(
  schedulerCronPattern,
  scheduleJob,
  null,
  false,
  'UTC'
);

const toggleChat = async (chatId: number, open: boolean) => {
  try {
    await bot.api.setChatPermissions(chatId, {
      can_send_messages: open,
      can_send_audios: open,
      can_send_documents: open,
      can_send_photos: open,
      can_send_videos: open,
      can_send_video_notes: open,
      can_send_voice_notes: open,
      can_send_polls: open,
      can_send_other_messages: open,
      can_add_web_page_previews: open,
      can_change_info: open,
      can_invite_users: open,
      can_pin_messages: open,
      can_manage_topics: open,
    });
  } catch (error: any) {
    if (!error?.description?.includes('CHAT_NOT_MODIFIED')) console.log(error);
  }
};
