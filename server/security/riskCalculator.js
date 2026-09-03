/**
 * Risk Score Calculator
 * Calculates user risk score based on various factors
 */

const pool = require('../config/database');

const RISK_FACTORS = {
  // User Behavior
  EXCESSIVE_TASK_ATTEMPTS: 15,
  RAPID_COMPLETION: 20,
  SUSPICIOUS_TIMING: 10,
  ABNORMAL_PATTERN: 15,

  // Account Status
  NEW_ACCOUNT: 10,
  UNVERIFIED_EMAIL: 5,
  PREVIOUS_FRAUD: 50,
  LOW_DEVICE_TRUST: 10,

  // Withdrawal Patterns
  IMMEDIATE_WITHDRAWAL: 15,
  MAX_AMOUNT_REQUESTED: 10,
  MULTIPLE_PAYMENT_METHODS: 8,

  // Referral Activity
  SELF_REFERRAL: 40,
  BULK_REFERRALS: 20,
  FAKE_REFERRALS: 50
};

const RISK_THRESHOLDS = {
  SAFE: { min: 0, max: 30, level: 'safe', action: 'allow' },
  WATCH: { min: 31, max: 50, level: 'watch', action: 'verify' },
  SUSPICIOUS: { min: 51, max: 70, level: 'suspicious', action: 'pending' },
  HIGH_RISK: { min: 71, max: 85, level: 'high_risk', action: 'hold' },
  FRAUD: { min: 86, max: 100, level: 'fraud', action: 'block' }
};

class RiskScoreCalculator {
  /**
   * Calculate user's overall risk score
   */
  static async calculateUserRiskScore(userId) {
    try {
      let riskScore = 0;
      const factors = {};

      // 1. Check account age
      const userQuery = await pool.query(
        'SELECT created_at FROM users WHERE id = $1',
        [userId]
      );
      const user = userQuery.rows[0];
      const accountAge = Date.now() - new Date(user.created_at).getTime();
      const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);

      if (daysSinceCreation < 1) {
        riskScore += RISK_FACTORS.NEW_ACCOUNT;
        factors.new_account = RISK_FACTORS.NEW_ACCOUNT;
      }

      // 2. Check task completion patterns
      const tasksQuery = await pool.query(`
        SELECT COUNT(*) as count, 
               EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at)))/60 as minutes_span
        FROM task_claims
        WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 hour'
      `, [userId]);

      const taskData = tasksQuery.rows[0];
      const tasksPerHour = parseInt(taskData.count);
      const minutesSpan = parseFloat(taskData.minutes_span) || 1;

      if (tasksPerHour > 20) {
        riskScore += RISK_FACTORS.EXCESSIVE_TASK_ATTEMPTS;
        factors.excessive_tasks = RISK_FACTORS.EXCESSIVE_TASK_ATTEMPTS;
      }

      // 3. Check completion speed
      const speedQuery = await pool.query(`
        SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/60) as avg_minutes
        FROM task_claims
        WHERE user_id = $1 AND completed_at IS NOT NULL
        AND created_at > NOW() - INTERVAL '24 hours'
        LIMIT 10
      `, [userId]);

      const avgCompletionTime = parseFloat(speedQuery.rows[0].avg_minutes) || 0;
      if (avgCompletionTime < 0.083) { // Less than 5 seconds
        riskScore += RISK_FACTORS.RAPID_COMPLETION;
        factors.rapid_completion = RISK_FACTORS.RAPID_COMPLETION;
      }

      // 4. Check for duplicate claims
      const duplicateQuery = await pool.query(`
        SELECT COUNT(*) as count FROM task_claims
        WHERE user_id = $1 AND status = 'verified'
        GROUP BY task_id
        HAVING COUNT(*) > 1
      `, [userId]);

      if (duplicateQuery.rows.length > 0) {
        riskScore += 30;
        factors.duplicate_claims = 30;
      }

      // 5. Check withdrawal patterns
      const withdrawalQuery = await pool.query(`
        SELECT COUNT(*) as count, SUM(amount) as total_amount
        FROM withdrawals
        WHERE user_id = $1 AND status IN ('pending', 'approved', 'paid')
        AND created_at > NOW() - INTERVAL '24 hours'
      `, [userId]);

      const withdrawalData = withdrawalQuery.rows[0];
      if (parseInt(withdrawalData.count) > 2) {
        riskScore += RISK_FACTORS.IMMEDIATE_WITHDRAWAL;
        factors.frequent_withdrawals = RISK_FACTORS.IMMEDIATE_WITHDRAWAL;
      }

      // 6. Check payment methods used
      const methodsQuery = await pool.query(`
        SELECT COUNT(DISTINCT payment_method) as method_count
        FROM withdrawals
        WHERE user_id = $1 AND created_at > NOW() - INTERVAL '7 days'
      `, [userId]);

      const methodCount = parseInt(methodsQuery.rows[0].method_count);
      if (methodCount > 2) {
        riskScore += RISK_FACTORS.MULTIPLE_PAYMENT_METHODS;
        factors.multiple_methods = RISK_FACTORS.MULTIPLE_PAYMENT_METHODS;
      }

      // 7. Check referral patterns
      const referralQuery = await pool.query(`
        SELECT COUNT(*) as count FROM referrals
        WHERE referrer_id = $1 AND is_valid = false
      `, [userId]);

      const invalidReferrals = parseInt(referralQuery.rows[0].count);
      if (invalidReferrals > 0) {
        riskScore += RISK_FACTORS.FAKE_REFERRALS;
        factors.invalid_referrals = RISK_FACTORS.FAKE_REFERRALS;
      }

      // Cap the score at 100
      riskScore = Math.min(riskScore, 100);

      // Save risk score
      await pool.query(
        'UPDATE users SET risk_score = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [riskScore, userId]
      );

      // Log the calculation
      await pool.query(`
        INSERT INTO risk_scores (id, user_id, score, level, factors, decision)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
      `, [
        userId,
        riskScore,
        this.getRiskLevel(riskScore),
        JSON.stringify(factors),
        this.getDecision(riskScore)
      ]);

      return {
        score: riskScore,
        level: this.getRiskLevel(riskScore),
        factors,
        decision: this.getDecision(riskScore)
      };
    } catch (error) {
      console.error('❌ Error calculating risk score:', error);
      throw error;
    }
  }

  /**
   * Get risk level from score
   */
  static getRiskLevel(score) {
    for (const [key, threshold] of Object.entries(RISK_THRESHOLDS)) {
      if (score >= threshold.min && score <= threshold.max) {
        return threshold.level;
      }
    }
    return 'fraud';
  }

  /**
   * Get decision from score
   */
  static getDecision(score) {
    for (const [key, threshold] of Object.entries(RISK_THRESHOLDS)) {
      if (score >= threshold.min && score <= threshold.max) {
        return threshold.action;
      }
    }
    return 'block';
  }

  /**
   * Calculate risk score for task claim
   */
  static async calculateTaskClaimRisk(userId, taskId) {
    try {
      let riskScore = 0;

      // Check if user already completed this task
      const existingQuery = await pool.query(`
        SELECT COUNT(*) as count FROM task_claims
        WHERE user_id = $1 AND task_id = $2 AND status = 'verified'
      `, [userId, taskId]);

      if (parseInt(existingQuery.rows[0].count) > 0) {
        riskScore += 50; // Already claimed this task
      }

      // Check task completion time
      const recentQuery = await pool.query(`
        SELECT EXTRACT(EPOCH FROM (completed_at - started_at)) as completion_seconds
        FROM task_claims
        WHERE user_id = $1 AND completed_at IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 1
      `, [userId]);

      if (recentQuery.rows.length > 0) {
        const completionSeconds = parseFloat(recentQuery.rows[0].completion_seconds);
        if (completionSeconds < 5) {
          riskScore += 20;
        }
      }

      return Math.min(riskScore, 100);
    } catch (error) {
      console.error('❌ Error calculating task claim risk:', error);
      return 0;
    }
  }

  /**
   * Calculate risk score for withdrawal
   */
  static async calculateWithdrawalRisk(userId, amount) {
    try {
      let riskScore = 0;

      // Get user info
      const userQuery = await pool.query(
        'SELECT available_balance, created_at FROM users WHERE id = $1',
        [userId]
      );
      const user = userQuery.rows[0];
      const daysSinceCreation = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24);

      // Check if new account requesting withdrawal
      if (daysSinceCreation < 1) {
        riskScore += 30;
      }

      // Check if immediate withdrawal
      const firstTaskQuery = await pool.query(`
        SELECT MIN(created_at) as first_task
        FROM task_claims
        WHERE user_id = $1 AND status = 'verified'
      `, [userId]);

      if (firstTaskQuery.rows.length > 0) {
        const hoursToWithdrawal = (Date.now() - new Date(firstTaskQuery.rows[0].first_task).getTime()) / (1000 * 60 * 60);
        if (hoursToWithdrawal < 1) {
          riskScore += 25;
        }
      }

      // Check if requesting max amount
      if (amount > 250) {
        riskScore += 15;
      }

      // Check previous withdrawal attempts
      const withdrawalQuery = await pool.query(`
        SELECT COUNT(*) as count FROM withdrawals
        WHERE user_id = $1 AND status IN ('rejected', 'held')
        AND created_at > NOW() - INTERVAL '7 days'
      `, [userId]);

      if (parseInt(withdrawalQuery.rows[0].count) > 2) {
        riskScore += 20;
      }

      return Math.min(riskScore, 100);
    } catch (error) {
      console.error('❌ Error calculating withdrawal risk:', error);
      return 0;
    }
  }
}

module.exports = RiskScoreCalculator;
