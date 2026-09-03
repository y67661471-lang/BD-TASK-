/**
 * Telegram Bot Configuration
 */

const { Telegraf } = require('telegraf');
require('dotenv').config();

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN is not set in .env file');
  process.exit(1);
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start((ctx) => {
  const miniAppUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}`;
  ctx.reply(
    '👋 Welcome to BD-TASK!\n\n🎯 Click the button below to open the app and start earning!',
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🚀 Open Mini App',
              web_app: { url: miniAppUrl }
            }
          ]
        ]
      }
    }
  );
});

bot.help((ctx) => {
  ctx.reply(`
📚 Help Guide\n
/start - Start the app
/help - Show this help message
/status - Check your account status
/balance - Check your balance
  `);
});

bot.command('status', (ctx) => {
  ctx.reply('✅ Bot is running smoothly!');
});

module.exports = bot;
