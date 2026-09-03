/**
 * Notification Service
 * Handles all user notifications
 */

const botHandler = require('./botHandler');
const pool = require('../config/database');

class NotificationService {
  /**
   * Send task completion notification
   */
  static async notifyTaskCompletion(userId, taskName, amount) {
    try {
      const userQuery = await pool.query(
        'SELECT telegram_id FROM users WHERE id = $1',
        [userId]
      );

      if (userQuery.rows.length === 0) return;

      const telegramId = userQuery.rows[0].telegram_id;
      await botHandler.sendRewardNotification(telegramId, amount, taskName);

      // Save notification to database
      await pool.query(`
        INSERT INTO notifications (id, user_id, title, message, type)
        VALUES (gen_random_uuid(), $1, $2, $3, $4)
      `, [
        userId,
        'Task Completed',
        `You earned ${amount} for completing "${taskName}"`,
        'reward'
      ]);
    } catch (error) {
      console.error('❌ Error sending task completion notification:', error);
    }
  }

  /**
   * Send withdrawal notification
   */
  static async notifyWithdrawal(userId, amount, status) {
    try {
      const userQuery = await pool.query(
        'SELECT telegram_id FROM users WHERE id = $1',
        [userId]
      );

      if (userQuery.rows.length === 0) return;

      const telegramId = userQuery.rows[0].telegram_id;
      await botHandler.sendWithdrawalNotification(telegramId, amount, status);

      // Save notification to database
      await pool.query(`
        INSERT INTO notifications (id, user_id, title, message, type)
        VALUES (gen_random_uuid(), $1, $2, $3, $4)
      `, [
        userId,
        'Withdrawal ' + status.toUpperCase(),
        `Your withdrawal of ${amount} has been ${status}`,
        'withdrawal'
      ]);
    } catch (error) {
      console.error('❌ Error sending withdrawal notification:', error);
    }
  }

  /**
   * Send security alert
   */
  static async notifySecurityAlert(userId, alertType, message) {
    try {
      const userQuery = await pool.query(
        'SELECT telegram_id FROM users WHERE id = $1',
        [userId]
      );

      if (userQuery.rows.length === 0) return;

      const telegramId = userQuery.rows[0].telegram_id;
      await botHandler.sendSecurityAlert(telegramId, alertType, message);

      // Save notification to database
      await pool.query(`
        INSERT INTO notifications (id, user_id, title, message, type)
        VALUES (gen_random_uuid(), $1, $2, $3, $4)
      `, [
        userId,
        'Security Alert',
        message,
        'alert'
      ]);
    } catch (error) {
      console.error('❌ Error sending security alert:', error);
    }
  }

  /**
   * Send bulk announcement
   */
  static async broadcastAnnouncement(title, message) {
    try {
      const usersQuery = await pool.query(
        'SELECT id, telegram_id FROM users WHERE status = \'active\''
      );

      for (const user of usersQuery.rows) {
        await botHandler.sendNotification(
          user.telegram_id,
          `📢 **${title}**\n\n${message}`
        );

        // Save notification
        await pool.query(`
          INSERT INTO notifications (id, user_id, title, message, type)
          VALUES (gen_random_uuid(), $1, $2, $3, $4)
        `, [user.id, title, message, 'info']);
      }

      console.log(`✅ Announcement sent to ${usersQuery.rows.length} users`);
    } catch (error) {
      console.error('❌ Error broadcasting announcement:', error);
    }
  }

  /**
   * Send referral bonus notification
   */
  static async notifyReferralBonus(referrerId, refereeUsername, bonusAmount) {
    try {
      const userQuery = await pool.query(
        'SELECT telegram_id FROM users WHERE id = $1',
        [referrerId]
      );

      if (userQuery.rows.length === 0) return;

      const telegramId = userQuery.rows[0].telegram_id;
      const message = `🎁 **Referral Bonus!**\n\nYour friend @${refereeUsername} completed their first task!\n\nYou earned ${bonusAmount} bonus!`;
      await botHandler.sendNotification(telegramId, message);

      // Save notification
      await pool.query(`
        INSERT INTO notifications (id, user_id, title, message, type)
        VALUES (gen_random_uuid(), $1, $2, $3, $4)
      `, [
        referrerId,
        'Referral Bonus',
        `Earned ${bonusAmount} from referral`,
        'reward'
      ]);
    } catch (error) {
      console.error('❌ Error sending referral notification:', error);
    }
  }
}

module.exports = NotificationService;
