import {
  Bot,
  Context,
  GrammyError,
  HttpError,
  MemorySessionStorage,
} from 'grammy';
import { config } from 'dotenv';
import { connectDB, User, Group } from './schemas';
import { getStartKeyboard } from './keyboards';
import { KnownUserError } from './errors';
import { validateConfig } from './utils';
import { chatMembers, type ChatMembersFlavor } from '@grammyjs/chat-members';
import { ChatMember } from 'grammy/types';

//* Init Env
config();

//* Init Bot Components
type MyContext = Context & ChatMembersFlavor;
const adapter = new MemorySessionStorage<ChatMember>();

const bot = new Bot<MyContext>(process.env.BOT_TOKEN as string);
bot.use(chatMembers(adapter));

connectDB();

//* Commands
bot.command('start', async (ctx) => {
  if (!ctx.from) return;

  if (ctx.chat.type === 'private') {
    //? private chat
    const { username, id, first_name, last_name } = ctx.from;
    const fullName = `${first_name} ${last_name || ''}`.trim();

    const exist = await User.findOne({ numericId: id });
    if (!exist) await User.create({ numericId: id, username, fullName });

    ctx.reply(
      `Hi ${fullName} 👋\nTo start using me you have to add me into your group!`,
      { reply_markup: getStartKeyboard() }
    );
  } else if (ctx.chat.type !== 'channel') {
    //? group and supergroup chat
    const { id, title, type } = ctx.chat;

    const exist = await Group.findOne({ chatId: id });
    if (!exist) await Group.create({ chatId: id, title });

    ctx.reply(
      `Thank you for joining me to ${title} ${type}!\nTo activate the bot make it as group full accessed admin.\nTo set this group timing configuration use /config@my_study_timer_bot command`
    );
  }
});

bot.command('config', async (ctx) => {
  if (!ctx.from) return;

  //! private chats and channels are not allowed
  if (ctx.chat.type === 'private' || ctx.chat.type === 'channel')
    throw new KnownUserError(
      'First join the bot to a group then use this command there!',
      getStartKeyboard()
    );

  const botInfo = await bot.botInfo;
  const botMembership = await ctx.api.getChatMember(ctx.chat.id, botInfo.id);

  //? check bot admins right
  if (
    botMembership.status !== 'administrator' &&
    botMembership.status !== 'creator'
  )
    throw new KnownUserError("I'm not admin. please make me admin first!");

  //? check user admins right
  const chatMember = await ctx.chatMembers.getChatMember();
  if (chatMember.status !== 'administrator' && chatMember.status !== 'creator')
    throw new KnownUserError("You're not allowed to manage this group!");

  const message = await ctx.reply(
    'Send your configurations in this format as a reply of this message:\n---------------------------------------------------\n\n[TIMEZONE OFFSET] (eg. +3:30)\n[DAYS YOU WANT TO STUDY] (eg. sat,sun,mon,...)\n[SESSION PERIODS] (eg. 16:00-18:00,20:00-22:00)\n[FOCUS & REST CYCLES] (eg. 25m-5m,1h-20m)\n\n---------------------------------------------------',
    {
      reply_parameters: ctx.message
        ? {
            message_id: ctx.message.message_id,
          }
        : undefined,
    }
  );

  //? update pending list
  await User.updateOne(
    { numericId: ctx.from.id },
    {
      $pull: {
        pendingConfigs: { chatId: ctx.chat.id },
      },
    }
  );
  await User.updateOne(
    { numericId: ctx.from.id },
    {
      $push: {
        pendingConfigs: { chatId: ctx.chat.id, messageId: message.message_id },
      },
    }
  );
});

bot.on('message', async (ctx) => {
  if (!ctx.from) return;
  if (!ctx.message.text) return;

  if (ctx.message.reply_to_message) {
    const {
      message_id: messageId,
      chat: { id: chatId },
    } = ctx.message.reply_to_message;

    //? validate user permission
    const exist = await User.findOne({
      numericId: ctx.from.id,
      pendingConfigs: { chatId, messageId },
    });
    if (!exist) return;

    //? validate config format
    const extractedConfig = validateConfig(ctx.message.text);

    //? update group config
    await Group.updateOne({ chatId }, { config: extractedConfig });

    //? remove user change request
    await User.updateOne(
      {
        numericId: ctx.from.id,
      },
      {
        $pull: { pendingConfigs: { chatId, messageId } },
      }
    );

    ctx.reply('Group config updated successfully', {
      reply_parameters: ctx.message
        ? { message_id: ctx.message.message_id }
        : undefined,
    });
  }
});

//* Error Handling
bot.catch((err) => {
  const { ctx } = err;
  console.error(`Error while handling update ${ctx.update.update_id}:`);

  const { error } = err;
  if (error instanceof GrammyError) {
    console.error('Error in request:', error.description);
  } else if (error instanceof HttpError) {
    console.error('Could not contact Telegram:', error);
  } else if (error instanceof KnownUserError) {
    console.error('Known user error');
    ctx.reply(`❌ ${error.message}`, {
      reply_markup: error.keyboard,
      reply_parameters: ctx.message
        ? { message_id: ctx.message.message_id }
        : undefined,
    });
  } else {
    console.error(error);
  }
});

//* Launch 🚀
bot.start({
  allowed_updates: ['chat_member', 'message'],
  onStart: () => console.log('Bot is ready to use 🚀'),
});

export { bot };

//? import after bot exportation
import { schedulerCron } from './schedules';
schedulerCron.start();
