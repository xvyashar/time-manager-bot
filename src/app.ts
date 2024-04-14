import { Bot, GrammyError, HttpError } from 'grammy';
import { config } from 'dotenv';
import { connectDB, User, Group } from './schemas';
import { getStartKeyboard } from './keyboards';
import { KnownUserError } from './errors';

//* Init Env
config();

//* Init Bot Components
const bot = new Bot(process.env.BOT_TOKEN as string);
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

  const message = await ctx.reply(
    'Send your configurations in this format as a reply of this message:\n---------------------------------------------------\n\n[DAYS YOU WANT TO STUDY] (eg. sat,sun,mon,...)\n[SESSION PERIODS] (eg. 16:00-18:00,20:00-22:00)\n[FOCUS & REST CYCLES] (eg. 25m-5m,1h-20m)\n\n---------------------------------------------------'
  );
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
    ctx.reply(`❌ ${error.message}`, { reply_markup: error.keyboard });
  }
});

//* Launch 🚀
bot.start({ onStart: () => console.log('Bot is ready to use 🚀') });

export { bot };
