/**
 * User Controller
 * Handles user-related operations
 */

const User = require('../models/User');
const pool = require('../config/database');
const RiskScoreCalculator = require('../security/riskCalculator');

class UserController {
  /**
   * Get user profile
   */
  static async getProfile(req, res) {
    try {
      const userId = req.user.user_id;
      const user = await User.getById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          id: user.id,
          telegram_id: user.telegram_id,
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          avatar_url: user.avatar_url,
          status: user.status,
          risk_score: user.risk_score,
          created_at: user.created_at
        }
      });
    } catch (error) {
      console.error('❌ Error getting profile:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get profile',
        error: error.message
      });
    }
  }

  /**
   * Get user balance
   */
  static async getBalance(req, res) {
    try {
      const userId = req.user.user_id;
      const balance = await User.getBalance(userId);

      if (!balance) {
        return res.status(404).json({
          success: false,
          message: 'Balance not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: balance
      });
    } catch (error) {
      console.error('❌ Error getting balance:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get balance',
        error: error.message
      });
    }
  }

  /**
   * Get user statistics
   */
  static async getStats(req, res) {
    try {
      const userId = req.user.user_id;
      const user = await User.getById(userId);

      const tasksQuery = await pool.query(`
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified_tasks,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_tasks,
          COUNT(CASE WHEN status = 'held' THEN 1 END) as held_tasks
        FROM task_claims
        WHERE user_id = $1
      `, [userId]);

      const referralQuery = await pool.query(`
        SELECT 
          COUNT(*) as total_referrals,
          COUNT(CASE WHEN is_valid = true THEN 1 END) as valid_referrals,
          COALESCE(SUM(CASE WHEN reward_status = 'earned' THEN reward_amount ELSE 0 END), 0) as referral_earnings
        FROM referrals
        WHERE referrer_id = $1
      `, [userId]);

      const withdrawalQuery = await pool.query(`
        SELECT 
          COUNT(*) as total_withdrawals,
          COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_withdrawals,
          COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_withdrawn
        FROM withdrawals
        WHERE user_id = $1
      `, [userId]);

      return res.status(200).json({
        success: true,
        data: {
          profile: {
            total_earned: user.total_earned,
            total_withdrawn: user.total_withdrawn,
            status: user.status,
            risk_score: user.risk_score
          },
          tasks: tasksQuery.rows[0],
          referrals: referralQuery.rows[0],
          withdrawals: withdrawalQuery.rows[0]
        }
      });
    } catch (error) {
      console.error('❌ Error getting stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get statistics',
        error: error.message
      });
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req, res) {
    try {
      const userId = req.user.user_id;
      const { first_name, last_name } = req.body;

      const result = await pool.query(`
        UPDATE users
        SET first_name = COALESCE($1, first_name),
            last_name = COALESCE($2, last_name),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING id, first_name, last_name, username
      `, [first_name || null, last_name || null, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message
      });
    }
  }

  /**
   * Get security status
   */
  static async getSecurityStatus(req, res) {
    try {
      const userId = req.user.user_id;
      const user = await User.getById(userId);

      const riskCalc = await RiskScoreCalculator.calculateUserRiskScore(userId);

      return res.status(200).json({
        success: true,
        data: {
          account_status: user.status,
          risk_score: riskCalc.score,
          risk_level: riskCalc.level,
          risk_factors: riskCalc.factors,
          security_recommendation: this.getSecurityRecommendation(riskCalc.level)
        }
      });
    } catch (error) {
      console.error('❌ Error getting security status:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get security status',
        error: error.message
      });
    }
  }

  /**
   * Get security recommendation based on risk level
   */
  static getSecurityRecommendation(riskLevel) {
    const recommendations = {
      safe: 'Your account is secure. Continue using the platform normally.',
      watch: 'Please verify your activity. Avoid unusual patterns.',
      suspicious: 'Your account is under review. Some features may be limited.',
      high_risk: 'Your account is temporarily restricted for security verification.',
      fraud: 'Your account has been suspended due to fraudulent activity.'
    };
    return recommendations[riskLevel] || 'Security status unknown';
  }
}

module.exports = UserController;
