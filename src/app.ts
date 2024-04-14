import { Bot } from 'grammy';
import { config } from 'dotenv';

//* Init Env
config();

//* Init Bot
const bot = new Bot(process.env.BOT_TOKEN as string);

//* Events
bot.on('message', (ctx) => ctx.reply('Hi there!'));

//* Launch 🚀
bot.start({ onStart: () => console.log('Bot is ready to use 🚀') });
