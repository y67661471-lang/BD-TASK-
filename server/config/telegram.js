const { Telegraf } = require('telegraf');
const database = require('./database');
require('dotenv').config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Start Command
bot.command('start', async (ctx) => {
  const telegramId = ctx.from.id;
  const username = ctx.from.username || `user_${telegramId}`;
  const firstName = ctx.from.first_name || '';

  try {
    // Check if user exists
    const result = await database.query(
      'SELECT id FROM users WHERE telegram_id = $1',
      [telegramId]
    );

    if (result.rows.length === 0) {
      // Create new user
      await database.query(
        `INSERT INTO users (telegram_id, username, first_name, balance, pending_balance, held_balance, status, created_at)
         VALUES ($1, $2, $3, 0, 0, 0, 'active', NOW())`,
        [telegramId, username, firstName]
      );
    }

    const miniAppUrl = process.env.MINI_APP_URL || 'http://localhost:3000';
    await ctx.reply(
      `👋 স্বাগতম ${firstName}!\n\n🎉 BD-TASK এ আপনাকে স্বাগতম।\n\n📺 বিজ্ঞাপন দেখুন এবং আয় করুন!`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '📱 অ্যাপ খুলুন',
                web_app: { url: miniAppUrl },
              },
            ],
          ],
        },
      }
    );
  } catch (error) {
    console.error('Error in /start command:', error);
    await ctx.reply('❌ একটি সমস্যা হয়েছে। পরে চেষ্টা করুন।');
  }
});

// Help Command
bot.command('help', async (ctx) => {
  await ctx.reply(
    `ℹ️ সাহায্য\n\n` +
      `/start - অ্যাপ শুরু করুন\n` +
      `/balance - ব্যালান্স দেখুন\n` +
      `/withdraw - আয় তোলার অনুরোধ করুন\n` +
      `/support - সাপোর্ট যোগাযোগ করুন`
  );
});

// Balance Command
bot.command('balance', async (ctx) => {
  try {
    const result = await database.query(
      'SELECT balance, pending_balance, held_balance FROM users WHERE telegram_id = $1',
      [ctx.from.id]
    );

    if (result.rows.length === 0) {
      return ctx.reply('❌ ব্যবহারকারী পাওয়া যায়নি।');
    }

    const { balance, pending_balance, held_balance } = result.rows[0];
    await ctx.reply(
      `💰 আপনার ব্যালান্স:\n\n` +
        `✅ উপলব্ধ: ${balance} টাকা\n` +
        `🕒 অপেক্ষমাণ: ${pending_balance} টাকা\n` +
        `🔒 ধরে রাখা: ${held_balance} টাকা`
    );
  } catch (error) {
    console.error('Error in /balance command:', error);
    ctx.reply('❌ একটি সমস্যা হয়েছে।');
  }
});

// Support Command
bot.command('support', async (ctx) => {
  await ctx.reply(
    `📞 সাপোর্ট:\n\n` +
      `📧 ইমেইল: support@bd-task.com\n` +
      `💬 Telegram: @BD_TASK_Support\n\n` +
      `আমরা ২৪/৭ সাহায্য করতে প্রস্তুত।`
  );
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = bot;
