/**
 * Fraud Detection Engine
 * Automatically detects and flags fraudulent activities
 */

const pool = require('../config/database');
const config = require('../config/config');

class FraudDetector {
  /**
   * Check for duplicate task claims
   */
  static async checkDuplicateClaim(userId, taskId, token) {
    try {
      const result = await pool.query(`
        SELECT COUNT(*) as count FROM task_claims
        WHERE user_id = $1 AND task_id = $2 AND status = 'verified'
      `, [userId, taskId]);

      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      console.error('❌ Error checking duplicate claim:', error);
      return false;
    }
  }

  /**
   * Check for token reuse
   */
  static async checkTokenReuse(token) {
    try {
      const result = await pool.query(`
        SELECT COUNT(*) as count FROM task_claims
        WHERE token = $1 AND is_token_used = true
      `, [token]);

      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      console.error('❌ Error checking token reuse:', error);
      return false;
    }
  }

  /**
   * Check for self-referral
   */
  static async checkSelfReferral(referrerId, refereeId) {
    try {
      // Check if same device/IP
      const result = await pool.query(`
        SELECT u1.device_fingerprint, u1.ip_address,
               u2.device_fingerprint as referee_fingerprint, u2.ip_address as referee_ip
        FROM users u1
        JOIN users u2 ON u1.device_fingerprint = u2.device_fingerprint
             OR u1.ip_address = u2.ip_address
        WHERE u1.id = $1 AND u2.id = $2
      `, [referrerId, refereeId]);

      return result.rows.length > 0;
    } catch (error) {
      console.error('❌ Error checking self-referral:', error);
      return false;
    }
  }

  /**
   * Check for abnormal withdrawal patterns
   */
  static async checkAbnormalWithdrawal(userId, amount) {
    try {
      // Get user's balance and history
      const userQuery = await pool.query(`
        SELECT available_balance, total_earned FROM users WHERE id = $1
      `, [userId]);

      if (userQuery.rows.length === 0) return true;

      const user = userQuery.rows[0];
      const totalEarned = parseFloat(user.total_earned);
      const requestedAmount = parseFloat(amount);

      // Check if requesting more than earned
      if (requestedAmount > totalEarned) {
        return true;
      }

      // Check withdrawal frequency
      const frequencyQuery = await pool.query(`
        SELECT COUNT(*) as count FROM withdrawals
        WHERE user_id = $1
        AND created_at > NOW() - INTERVAL '24 hours'
      `, [userId]);

      if (parseInt(frequencyQuery.rows[0].count) > 3) {
        return true; // More than 3 withdrawals per day
      }

      return false;
    } catch (error) {
      console.error('❌ Error checking abnormal withdrawal:', error);
      return false;
    }
  }

  /**
   * Check for bot-like behavior
   */
  static async checkBotBehavior(userId) {
    try {
      // Get last 10 task completions
      const tasksQuery = await pool.query(`
        SELECT 
          EXTRACT(EPOCH FROM (completed_at - started_at)) as completion_time,
          created_at
        FROM task_claims
        WHERE user_id = $1 AND completed_at IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 10
      `, [userId]);

      if (tasksQuery.rows.length < 5) return false;

      const completionTimes = tasksQuery.rows.map(r => parseFloat(r.completion_time));
      const avgTime = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length;
      const variance = completionTimes.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / completionTimes.length;

      // Very consistent timing suggests bot behavior
      if (variance < 1 && avgTime < 10) {
        return true;
      }

      // Check for perfectly regular intervals
      const intervals = [];
      for (let i = 1; i < tasksQuery.rows.length; i++) {
        const interval = new Date(tasksQuery.rows[i - 1].created_at) - new Date(tasksQuery.rows[i].created_at);
        intervals.push(interval);
      }

      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const intervalVariance = intervals.reduce((sum, int) => sum + Math.pow(int - avgInterval, 2), 0) / intervals.length;

      // Very consistent intervals suggest automation
      if (intervalVariance < 1000) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error checking bot behavior:', error);
      return false;
    }
  }

  /**
   * Perform comprehensive fraud check
   */
  static async performFraudCheck(userId, taskId, token) {
    try {
      const alerts = [];

      // Check 1: Duplicate claim
      if (await this.checkDuplicateClaim(userId, taskId, token)) {
        alerts.push({
          type: 'duplicate_claim',
          severity: 'high',
          message: 'User already claimed this task'
        });
      }

      // Check 2: Token reuse
      if (await this.checkTokenReuse(token)) {
        alerts.push({
          type: 'token_reuse',
          severity: 'critical',
          message: 'Token has already been used'
        });
      }

      // Check 3: Bot behavior
      if (await this.checkBotBehavior(userId)) {
        alerts.push({
          type: 'bot_behavior',
          severity: 'high',
          message: 'Suspicious automated activity detected'
        });
      }

      return {
        is_fraudulent: alerts.length > 0,
        alerts,
        severity: alerts.length > 0 ? alerts[0].severity : 'none'
      };
    } catch (error) {
      console.error('❌ Error performing fraud check:', error);
      return {
        is_fraudulent: false,
        alerts: [],
        severity: 'none'
      };
    }
  }

  /**
   * Log security event
   */
  static async logSecurityEvent(userId, eventType, severity, description, ipAddress = null) {
    try {
      await pool.query(`
        INSERT INTO security_events (id, user_id, event_type, severity, description, ip_address, created_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      `, [userId, eventType, severity, description, ipAddress]);
    } catch (error) {
      console.error('❌ Error logging security event:', error);
    }
  }
}

module.exports = FraudDetector;
