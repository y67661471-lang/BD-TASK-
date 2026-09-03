/**
 * Admin Controller
 * Handles admin panel operations
 */

const User = require('../models/User');
const Task = require('../models/Task');
const Withdrawal = require('../models/Withdrawal');
const pool = require('../config/database');
const SecurityMonitor = require('../security/securityMonitor');
const { v4: uuidv4 } = require('uuid');

class AdminController {
  /**
   * Get dashboard statistics
   */
  static async getDashboard(req, res) {
    try {
      const users = await User.getStatistics();
      const tasks = await Task.getStatistics();
      const withdrawals = await Withdrawal.getStatistics();

      return res.status(200).json({
        success: true,
        data: {
          users,
          tasks,
          withdrawals
        }
      });
    } catch (error) {
      console.error('❌ Error getting dashboard:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get dashboard',
        error: error.message
      });
    }
  }

  /**
   * Get all users
   */
  static async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 50 } = req.query;
      const users = await User.getAllUsers(parseInt(page), parseInt(limit));

      return res.status(200).json({
        success: true,
        message: `Found ${users.length} users`,
        pagination: { page: parseInt(page), limit: parseInt(limit) },
        data: users
      });
    } catch (error) {
      console.error('❌ Error getting users:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get users',
        error: error.message
      });
    }
  }

  /**
   * Get suspicious users
   */
  static async getSuspiciousUsers(req, res) {
    try {
      const suspiciousUsers = await SecurityMonitor.getSuspiciousUsers(50);

      return res.status(200).json({
        success: true,
        message: `Found ${suspiciousUsers.length} suspicious users`,
        data: suspiciousUsers
      });
    } catch (error) {
      console.error('❌ Error getting suspicious users:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get suspicious users',
        error: error.message
      });
    }
  }

  /**
   * Get security alerts
   */
  static async getSecurityAlerts(req, res) {
    try {
      const { limit = 50 } = req.query;
      const alerts = await SecurityMonitor.getSecurityAlerts(parseInt(limit));

      return res.status(200).json({
        success: true,
        message: `Found ${alerts.length} security alerts`,
        data: alerts
      });
    } catch (error) {
      console.error('❌ Error getting alerts:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get alerts',
        error: error.message
      });
    }
  }

  /**
   * Ban user
   */
  static async banUser(req, res) {
    try {
      const { user_id } = req.params;
      const { reason } = req.body;

      const result = await User.updateStatus(user_id, 'banned');

      // Log audit
      await pool.query(`
        INSERT INTO audit_logs (id, admin_id, action, resource_type, resource_id, changes)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        uuidv4(),
        req.admin.admin_id,
        'ban_user',
        'user',
        user_id,
        JSON.stringify({ reason })
      ]);

      return res.status(200).json({
        success: true,
        message: 'User banned successfully',
        data: result
      });
    } catch (error) {
      console.error('❌ Error banning user:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to ban user',
        error: error.message
      });
    }
  }

  /**
   * Approve withdrawal
   */
  static async approveWithdrawal(req, res) {
    try {
      const { withdrawal_id } = req.params;
      const { payment_confirmation_id } = req.body;

      const withdrawal = await Withdrawal.getById(withdrawal_id);
      if (!withdrawal) {
        return res.status(404).json({
          success: false,
          message: 'Withdrawal not found'
        });
      }

      const updated = await Withdrawal.updateStatus(withdrawal_id, 'paid', {
        payment_confirmation_id
      });

      // Update user balance
      const user = await User.getById(withdrawal.user_id);
      await User.updateBalance(
        withdrawal.user_id,
        user.available_balance,
        user.pending_balance,
        Math.max(0, user.held_balance - withdrawal.amount)
      );

      // Log audit
      await pool.query(`
        INSERT INTO audit_logs (id, admin_id, action, resource_type, resource_id, changes)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        uuidv4(),
        req.admin.admin_id,
        'approve_withdrawal',
        'withdrawal',
        withdrawal_id,
        JSON.stringify({ payment_confirmation_id })
      ]);

      return res.status(200).json({
        success: true,
        message: 'Withdrawal approved and processed',
        data: updated
      });
    } catch (error) {
      console.error('❌ Error approving withdrawal:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to approve withdrawal',
        error: error.message
      });
    }
  }

  /**
   * Create new task
   */
  static async createTask(req, res) {
    try {
      const { name, description, reward, daily_limit, cooldown_hours, verification_method } = req.body;

      const task = await Task.create({
        name,
        description,
        reward,
        daily_limit,
        cooldown_hours,
        verification_method,
        status: 'active'
      });

      // Log audit
      await pool.query(`
        INSERT INTO audit_logs (id, admin_id, action, resource_type, resource_id, changes)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        uuidv4(),
        req.admin.admin_id,
        'create_task',
        'task',
        task.id,
        JSON.stringify({ name, reward })
      ]);

      return res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: task
      });
    } catch (error) {
      console.error('❌ Error creating task:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create task',
        error: error.message
      });
    }
  }
}

module.exports = AdminController;
