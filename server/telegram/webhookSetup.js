/**
 * Telegram Webhook Setup
 * For webhook-based polling
 */

const express = require('express');
const router = express.Router();
const { Telegraf } = require('telegraf');
const config = require('../config/config');

class TelegramWebhook {
  static async setupWebhook(app) {
    const bot = new Telegraf(config.TELEGRAM_BOT_TOKEN);
    const webhookUrl = `${config.REACT_APP_API_URL}/telegram/webhook`;

    try {
      // Set webhook
      await bot.telegram.setWebhook(webhookUrl);
      console.log(`✅ Webhook set to: ${webhookUrl}`);

      // Setup webhook endpoint
      app.post('/telegram/webhook', (req, res) => {
        bot.handleUpdate(req.body);
        res.sendStatus(200);
      });
    } catch (error) {
      console.error('❌ Failed to set webhook:', error);
    }
  }
}

module.exports = TelegramWebhook;
