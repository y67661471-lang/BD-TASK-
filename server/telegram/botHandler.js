/**
 * Telegram Bot Handler
 * Handles all Telegram bot interactions
 */

const { Telegraf, session } = require('telegraf');
const pool = require('../config/database');
const config = require('../config/config');
const User = require('../models/User');

class TelegramBotHandler {
  constructor() {
    this.bot = new Telegraf(config.TELEGRAM_BOT_TOKEN);
    this.miniAppUrl = config.REACT_APP_API_URL || 'http://localhost:3000';
    this.setupMiddleware();
    this.setupCommands();
    this.setupErrorHandling();
  }

  /**
   * Setup middleware
   */
  setupMiddleware() {
    this.bot.use(session());
    this.bot.use(async (ctx, next) => {
      const start = Date.now();
      await next();
      const ms = Date.now() - start;
      console.log(`⏱️ Response time: ${ms}ms`);
    });
  }

  /**
   * Setup bot commands
   */
  setupCommands() {
    // /start command - Open Mini App
    this.bot.start(async (ctx) => {
      try {
        const userId = ctx.from.id;
        const userData = ctx.from;

        // Create or update user
        await User.createOrUpdate({
          id: userId,
          first_name: userData.first_name,
          last_name: userData.last_name,
          username: userData.username,
          device_fingerprint: null,
          ip_address: null
        });

        ctx.reply(
          '🎉 Welcome to BD-TASK!\n\n' +
          'Click the button below to open the app and start earning by watching ads and completing tasks.\n\n' +
          '💰 Rewards: Instant withdrawals via bKash, Nagad, and more\n' +
          '🛡️ Security: 24/7 fraud protection\n' +
          '👥 Referral: Earn from your friends',
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '🚀 Open BD-TASK Mini App',
                    web_app: { url: this.miniAppUrl }
                  }
                ],
                [
                  {
                    text: '📚 Help',
                    callback_data: 'help'
                  },
                  {
                    text: '📊 Status',
                    callback_data: 'status'
                  }
                ]
              ]
            }
          }
        );
      } catch (error) {
        console.error('❌ Error in /start:', error);
        ctx.reply('❌ An error occurred. Please try again.');
      }
    });

    // /help command
    this.bot.command('help', (ctx) => {
      ctx.reply(
        '📚 **BD-TASK Help Guide**\n\n' +
        '/start - Open the Mini App\n' +
        '/help - Show this help message\n' +
        '/status - Check your account status\n' +
        '/balance - Check your current balance\n' +
        '/tasks - View available tasks\n' +
        '/withdrawals - Check withdrawal history\n\n' +
        '**Need support?**\n' +
        'Visit our support center in the app or contact @support'
      );
    });

    // /status command
    this.bot.command('status', async (ctx) => {
      try {
        const userId = ctx.from.id;
        const user = await User.getByTelegramId(userId);

        if (!user) {
          return ctx.reply('👤 User not found. Please use /start to create your account.');
        }

        ctx.reply(
          `📊 **Your Account Status**\n\n` +
          `👤 Name: ${user.first_name} ${user.last_name || ''}\n` +
          `📱 Username: @${user.username || 'N/A'}\n` +
          `💰 Available Balance: ${user.available_balance}\n` +
          `🕒 Pending Balance: ${user.pending_balance}\n` +
          `🔐 Account Status: ${user.status.toUpperCase()}\n` +
          `⚠️ Risk Score: ${user.risk_score}/100`,
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        console.error('❌ Error in /status:', error);
        ctx.reply('❌ Failed to get status.');
      }
    });

    // /balance command
    this.bot.command('balance', async (ctx) => {
      try {
        const userId = ctx.from.id;
        const user = await User.getByTelegramId(userId);

        if (!user) {
          return ctx.reply('👤 User not found. Please use /start to create your account.');
        }

        ctx.reply(
          `💰 **Your Balance**\n\n` +
          `✅ Available: ${user.available_balance}\n` +
          `⏳ Pending: ${user.pending_balance}\n` +
          `🔒 Held: ${user.held_balance}\n` +
          `📊 Total Earned: ${user.total_earned}\n` +
          `💸 Total Withdrawn: ${user.total_withdrawn}`,
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        console.error('❌ Error in /balance:', error);
        ctx.reply('❌ Failed to get balance.');
      }
    });

    // Callback query handlers
    this.bot.action('help', (ctx) => {
      ctx.answerCbQuery();
      ctx.reply(
        '📚 **Help & FAQ**\n\n' +
        '**Q: How do I earn?**\n' +
        'A: Complete tasks, watch ads, and refer friends.\n\n' +
        '**Q: When can I withdraw?**\n' +
        'A: Minimum 10 taka. Instant withdrawal via bKash/Nagad.\n\n' +
        '**Q: Is my account safe?**\n' +
        'A: Yes! We use 24/7 fraud detection.\n\n' +
        '**Q: How much can I earn?**\n' +
        'A: Unlimited! Depends on your activity.'
      );
    });

    this.bot.action('status', async (ctx) => {
      ctx.answerCbQuery();
      await this.bot.telegram.sendMessage(
        ctx.from.id,
        '✅ Bot is running smoothly!'
      );
    });
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    this.bot.catch((err, ctx) => {
      console.error('❌ Bot error:', err);
      ctx.reply('❌ An unexpected error occurred. Please try again.');
    });
  }

  /**
   * Send notification to user
   */
  async sendNotification(telegramId, message, options = {}) {
    try {
      await this.bot.telegram.sendMessage(telegramId, message, {
        parse_mode: 'Markdown',
        ...options
      });
    } catch (error) {
      console.error(`❌ Failed to send notification to ${telegramId}:`, error);
    }
  }

  /**
   * Send reward notification
   */
  async sendRewardNotification(telegramId, amount, taskName) {
    const message = `💰 **Reward Credited!**\n\nYou earned ${amount} for completing "${taskName}"\n\nOpen the app to withdraw!`;
    await this.sendNotification(telegramId, message);
  }

  /**
   * Send withdrawal notification
   */
  async sendWithdrawalNotification(telegramId, amount, status) {
    const statusEmoji = {
      approved: '✅',
      paid: '💸',
      rejected: '❌',
      held: '⏳'
    };
    const message = `${statusEmoji[status] || '📝'} **Withdrawal ${status.toUpperCase()}**\n\nAmount: ${amount}\n\nCheck your app for details.`;
    await this.sendNotification(telegramId, message);
  }

  /**
   * Send security alert
   */
  async sendSecurityAlert(telegramId, alertType, message) {
    const fullMessage = `🛡️ **Security Alert**\n\n${message}\n\nIf this wasn't you, please secure your account immediately.`;
    await this.sendNotification(telegramId, fullMessage);
  }

  /**
   * Start bot
   */
  start() {
    this.bot.launch({
      polling: {
        interval: 300,
        timeout: 30
      }
    });
    console.log('✅ Telegram Bot started successfully!');
    console.log(`🤖 Bot: @${config.TELEGRAM_BOT_USERNAME}`);
  }

  /**
   * Get bot instance
   */
  getBot() {
    return this.bot;
  }
}

module.exports = new TelegramBotHandler();
