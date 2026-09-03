/**
 * Withdrawal Controller
 * Handles withdrawal requests and processing
 */

const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const pool = require('../config/database');
const SecurityMonitor = require('../security/securityMonitor');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');

class WithdrawalController {
  /**
   * Request withdrawal
   */
  static async requestWithdrawal(req, res) {
    try {
      const userId = req.user.user_id;
      const { amount, payment_method, payment_method_detail } = req.body;

      // Validate inputs
      if (!amount || !payment_method || !payment_method_detail) {
        return res.status(400).json({
          success: false,
          message: 'amount, payment_method, and payment_method_detail are required'
        });
      }

      // Get user balance
      const user = await User.getById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check minimum withdrawal
      if (amount < 10) {
        return res.status(400).json({
          success: false,
          message: 'Minimum withdrawal amount is 10'
        });
      }

      // Check available balance
      if (amount > user.available_balance) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance'
        });
      }

      // Create withdrawal request
      const withdrawal = await Withdrawal.create({
        user_id: userId,
        amount,
        payment_method,
        payment_method_detail,
        status: 'pending'
      });

      // Monitor withdrawal for security
      const securityResult = await SecurityMonitor.monitorWithdrawal(
        withdrawal.id,
        userId,
        amount
      );

      // Deduct from available balance
      if (securityResult.status !== 'rejected') {
        await User.updateBalance(
          userId,
          user.available_balance - amount,
          user.pending_balance,
          user.held_balance + (securityResult.status === 'held' ? amount : 0)
        );
      }

      return res.status(201).json({
        success: true,
        message: `Withdrawal request ${securityResult.action}`,
        data: {
          withdrawal_id: withdrawal.id,
          amount,
          status: securityResult.status,
          security_check: securityResult
        }
      });
    } catch (error) {
      console.error('❌ Error requesting withdrawal:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to request withdrawal',
        error: error.message
      });
    }
  }

  /**
   * Get user's withdrawals
   */
  static async getUserWithdrawals(req, res) {
    try {
      const userId = req.user.user_id;
      const { status } = req.query;

      const withdrawals = await Withdrawal.getUserWithdrawals(userId, status || null);

      return res.status(200).json({
        success: true,
        message: `Found ${withdrawals.length} withdrawals`,
        data: withdrawals
      });
    } catch (error) {
      console.error('❌ Error getting withdrawals:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get withdrawals',
        error: error.message
      });
    }
  }

  /**
   * Get withdrawal by ID
   */
  static async getWithdrawal(req, res) {
    try {
      const userId = req.user.user_id;
      const { withdrawal_id } = req.params;

      const withdrawal = await Withdrawal.getById(withdrawal_id);

      if (!withdrawal || withdrawal.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: 'Withdrawal not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: withdrawal
      });
    } catch (error) {
      console.error('❌ Error getting withdrawal:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get withdrawal',
        error: error.message
      });
    }
  }

  /**
   * Cancel withdrawal (Admin only)
   */
  static async cancelWithdrawal(req, res) {
    try {
      const { withdrawal_id } = req.params;
      const { reason } = req.body;

      const withdrawal = await Withdrawal.getById(withdrawal_id);
      if (!withdrawal) {
        return res.status(404).json({
          success: false,
          message: 'Withdrawal not found'
        });
      }

      // Update withdrawal status
      const updated = await Withdrawal.updateStatus(withdrawal_id, 'rejected', {
        rejection_reason: reason
      });

      // Refund to user
      const user = await User.getById(withdrawal.user_id);
      await User.updateBalance(
        withdrawal.user_id,
        user.available_balance + withdrawal.amount,
        user.pending_balance,
        user.held_balance
      );

      return res.status(200).json({
        success: true,
        message: 'Withdrawal cancelled and refunded',
        data: updated
      });
    } catch (error) {
      console.error('❌ Error cancelling withdrawal:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to cancel withdrawal',
        error: error.message
      });
    }
  }
}

module.exports = WithdrawalController;
