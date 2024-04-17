import { minutesBeforeCycleStart, schedulerCronPattern } from '../constants';
import { CronJob } from 'cron';
import { bot } from '../app';

import { Group, Cycle } from '../schemas';
import moment from 'moment-timezone';
import { extractCycles, timeToMinutes } from '../utils';

export const schedulerCron = new CronJob(
  schedulerCronPattern,
  async () => {
    try {
      //? manage groups cycles start and stop
      const groups = await Group.find();
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];

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

        const localeDate = moment().utcOffset(group.config.timezoneOffset);
        const time = `${
          localeDate.hours() < 10 ? '0' : ''
        }${localeDate.hours()}:${
          localeDate.minutes() < 10 ? '0' : ''
        }${localeDate.minutes()}`;

        const today = localeDate.format('ddd').toLowerCase();
        if (!group.config.days.includes(today)) continue;

        for (let i = 0; i < group.config.sessionPeriods.length; i++) {
          const session = group.config.sessionPeriods[i];
          if (
            timeToMinutes(session.start) - minutesBeforeCycleStart ===
            timeToMinutes(time)
          ) {
            //? 5 minutes before starting cycle
            await bot.api.sendMessage(
              group.chatId as number,
              `It's ${minutesBeforeCycleStart} minutes before starting the cycle. Get ready for focus time!`
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
                'Time cycle has been started, go and have fun with your works!'
              );

              await bot.api.setChatPermissions(group.chatId as number, {
                can_send_messages: false,
                can_send_audios: false,
                can_send_documents: false,
                can_send_photos: false,
                can_send_videos: false,
                can_send_video_notes: false,
                can_send_voice_notes: false,
                can_send_polls: false,
                can_send_other_messages: false,
                can_add_web_page_previews: false,
                can_change_info: false,
                can_invite_users: false,
                can_pin_messages: false,
                can_manage_topics: false,
              });
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
                await bot.api.setChatPermissions(group.chatId as number, {
                  can_send_messages: true,
                  can_send_audios: true,
                  can_send_documents: true,
                  can_send_photos: true,
                  can_send_videos: true,
                  can_send_video_notes: true,
                  can_send_voice_notes: true,
                  can_send_polls: true,
                  can_send_other_messages: true,
                  can_add_web_page_previews: true,
                  can_change_info: true,
                  can_invite_users: true,
                  can_pin_messages: true,
                  can_manage_topics: true,
                });

                await bot.api.sendMessage(
                  group.chatId as number,
                  "Congratulation🥳. Cycle has been finished successfully, let's have a deep rest!"
                );
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
  },
  null,
  false,
  'UTC'
);
