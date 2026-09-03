/**
 * Security Event Monitor
 * Monitors and triggers security actions
 */

const pool = require('../config/database');
const config = require('../config/config');
const FraudDetector = require('./fraudDetector');
const RiskScoreCalculator = require('./riskCalculator');

class SecurityMonitor {
  /**
   * Monitor task completion
   */
  static async monitorTaskCompletion(claimId, userId, taskId) {
    try {
      // Calculate risk score for this claim
      const taskRisk = await RiskScoreCalculator.calculateTaskClaimRisk(userId, taskId);

      // Perform fraud check
      const claim = await pool.query('SELECT token FROM task_claims WHERE id = $1', [claimId]);
      const fraudCheck = await FraudDetector.performFraudCheck(userId, taskId, claim.rows[0].token);

      // Determine action
      let action = 'allow';
      let status = 'verified';

      if (fraudCheck.is_fraudulent) {
        if (fraudCheck.severity === 'critical') {
          action = 'block';
          status = 'rejected';
        } else if (fraudCheck.severity === 'high') {
          action = 'hold';
          status = 'held';
        }
      } else if (taskRisk > config.FRAUD_THRESHOLD) {
        action = 'hold';
        status = 'held';
      } else if (taskRisk > config.WARNING_THRESHOLD) {
        action = 'verify';
        status = 'pending';
      }

      // Update claim
      await pool.query(`
        UPDATE task_claims
        SET status = $1, risk_score = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [status, taskRisk, claimId]);

      // Log event
      if (action !== 'allow') {
        await FraudDetector.logSecurityEvent(
          userId,
          'task_completion_flagged',
          fraudCheck.severity || 'warning',
          `Task claim flagged with action: ${action}`,
          null
        );
      }

      return { action, status, risk_score: taskRisk, fraud_check: fraudCheck };
    } catch (error) {
      console.error('❌ Error monitoring task completion:', error);
      return { action: 'hold', status: 'held', error: error.message };
    }
  }

  /**
   * Monitor withdrawal request
   */
  static async monitorWithdrawal(withdrawalId, userId, amount) {
    try {
      // Calculate withdrawal risk
      const withdrawalRisk = await RiskScoreCalculator.calculateWithdrawalRisk(userId, amount);

      // Check for abnormal patterns
      const isAbnormal = await FraudDetector.checkAbnormalWithdrawal(userId, amount);

      // Determine action
      let action = 'approve';
      let status = 'approved';

      if (isAbnormal || withdrawalRisk > config.FRAUD_THRESHOLD) {
        action = 'reject';
        status = 'rejected';
      } else if (withdrawalRisk > config.WARNING_THRESHOLD) {
        action = 'hold';
        status = 'held';
      }

      // Update withdrawal
      await pool.query(`
        UPDATE withdrawals
        SET status = $1, risk_score = $2, robot_decision = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [status, withdrawalRisk, action, withdrawalId]);

      // Log event
      if (action !== 'approve') {
        await FraudDetector.logSecurityEvent(
          userId,
          'withdrawal_flagged',
          withdrawalRisk > config.FRAUD_THRESHOLD ? 'critical' : 'warning',
          `Withdrawal of ${amount} flagged with action: ${action}`,
          null
        );
      }

      return { action, status, risk_score: withdrawalRisk, is_abnormal: isAbnormal };
    } catch (error) {
      console.error('❌ Error monitoring withdrawal:', error);
      return { action: 'hold', status: 'held', error: error.message };
    }
  }

  /**
   * Update user security status
   */
  static async updateUserSecurityStatus(userId) {
    try {
      const riskCalc = await RiskScoreCalculator.calculateUserRiskScore(userId);
      const userStatus = riskCalc.score > config.FRAUD_THRESHOLD ? 'banned' : 'active';

      await pool.query(`
        UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
      `, [userStatus, userId]);

      return { user_status: userStatus, risk_score: riskCalc.score };
    } catch (error) {
      console.error('❌ Error updating security status:', error);
      return { error: error.message };
    }
  }

  /**
   * Get suspicious users
   */
  static async getSuspiciousUsers(minRisk = config.WARNING_THRESHOLD) {
    try {
      const result = await pool.query(`
        SELECT id, telegram_id, first_name, risk_score, status
        FROM users
        WHERE risk_score >= $1
        ORDER BY risk_score DESC
        LIMIT 100
      `, [minRisk]);

      return result.rows;
    } catch (error) {
      console.error('❌ Error getting suspicious users:', error);
      return [];
    }
  }

  /**
   * Get security alerts
   */
  static async getSecurityAlerts(limit = 50) {
    try {
      const result = await pool.query(`
        SELECT * FROM security_events
        WHERE severity IN ('warning', 'critical')
        ORDER BY created_at DESC
        LIMIT $1
      `, [limit]);

      return result.rows;
    } catch (error) {
      console.error('❌ Error getting alerts:', error);
      return [];
    }
  }
}

module.exports = SecurityMonitor;
