/**
 * Event Emitter for Telegram Integration
 * Coordinates between API and Bot
 */

const EventEmitter = require('events');
const NotificationService = require('./notificationService');
const botHandler = require('./botHandler');

class TelegramEventEmitter extends EventEmitter {}

const telegramEvents = new TelegramEventEmitter();

// Task completion event
telegramEvents.on('task:completed', async (data) => {
  const { userId, taskName, amount } = data;
  await NotificationService.notifyTaskCompletion(userId, taskName, amount);
});

// Withdrawal event
telegramEvents.on('withdrawal:updated', async (data) => {
  const { userId, amount, status } = data;
  await NotificationService.notifyWithdrawal(userId, amount, status);
});

// Security alert event
telegramEvents.on('security:alert', async (data) => {
  const { userId, alertType, message } = data;
  await NotificationService.notifySecurityAlert(userId, alertType, message);
});

// Referral bonus event
telegramEvents.on('referral:bonus', async (data) => {
  const { referrerId, refereeUsername, bonusAmount } = data;
  await NotificationService.notifyReferralBonus(referrerId, refereeUsername, bonusAmount);
});

// Announcement event
telegramEvents.on('announcement:broadcast', async (data) => {
  const { title, message } = data;
  await NotificationService.broadcastAnnouncement(title, message);
});

module.exports = telegramEvents;
