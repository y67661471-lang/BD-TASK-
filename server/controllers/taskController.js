/**
 * Task Controller
 * Handles task-related operations
 */

const Task = require('../models/Task');
const TaskClaim = require('../models/TaskClaim');
const pool = require('../config/database');
const TokenManager = require('../security/tokenManager');
const RewardEngine = require('../security/rewardEngine');
const SecurityMonitor = require('../security/securityMonitor');
const { v4: uuidv4 } = require('uuid');

class TaskController {
  /**
   * Get available tasks
   */
  static async getAvailableTasks(req, res) {
    try {
      const userId = req.user.user_id;
      const tasks = await Task.getAvailableTasksForUser(userId);

      return res.status(200).json({
        success: true,
        message: `Found ${tasks.length} available tasks`,
        data: tasks.map(task => ({
          id: task.id,
          name: task.name,
          description: task.description,
          reward: task.reward,
          cooldown_hours: task.cooldown_hours,
          provider_name: task.provider_name,
          priority: task.priority
        }))
      });
    } catch (error) {
      console.error('❌ Error getting tasks:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get tasks',
        error: error.message
      });
    }
  }

  /**
   * Start a task
   */
  static async startTask(req, res) {
    try {
      const userId = req.user.user_id;
      const { task_id } = req.body;

      if (!task_id) {
        return res.status(400).json({
          success: false,
          message: 'task_id is required'
        });
      }

      // Verify task exists
      const task = await Task.getById(task_id);
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      // Check if user already claimed this task
      const alreadyClaimed = await TaskClaim.hasUserClaimedTask(userId, task_id);
      if (alreadyClaimed) {
        return res.status(400).json({
          success: false,
          message: 'You have already completed this task'
        });
      }

      // Create task claim
      const claim = await TaskClaim.create({
        user_id: userId,
        task_id: task_id,
        verification_method: task.verification_method
      });

      return res.status(201).json({
        success: true,
        message: 'Task started successfully',
        data: {
          claim_id: claim.id,
          token: claim.token,
          token_expires_at: claim.token_expires_at,
          task_id: claim.task_id,
          reward: task.reward
        }
      });
    } catch (error) {
      console.error('❌ Error starting task:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to start task',
        error: error.message
      });
    }
  }

  /**
   * Complete a task
   */
  static async completeTask(req, res) {
    try {
      const userId = req.user.user_id;
      const { token, completion_data } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required'
        });
      }

      // Verify token
      const tokenData = await TokenManager.verifyToken(token);
      if (!tokenData.valid) {
        return res.status(401).json({
          success: false,
          message: tokenData.error
        });
      }

      // Verify user owns this claim
      if (tokenData.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized access'
        });
      }

      // Mark token as used
      const markResult = await TokenManager.markTokenUsed(token, completion_data || {});
      if (!markResult.success) {
        return res.status(400).json({
          success: false,
          message: markResult.error
        });
      }

      // Process reward
      const rewardResult = await RewardEngine.processTaskReward(
        tokenData.claim_id,
        userId,
        tokenData.task_id
      );

      return res.status(200).json({
        success: rewardResult.success,
        message: rewardResult.success ? 'Task completed successfully' : 'Task completion failed',
        data: {
          reward_id: rewardResult.reward_id,
          amount: rewardResult.amount,
          status: rewardResult.status,
          security_check: rewardResult.security_check
        }
      });
    } catch (error) {
      console.error('❌ Error completing task:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to complete task',
        error: error.message
      });
    }
  }

  /**
   * Get user's task claims
   */
  static async getUserClaims(req, res) {
    try {
      const userId = req.user.user_id;
      const { status } = req.query;

      const claims = await TaskClaim.getUserClaims(userId, status || null);

      return res.status(200).json({
        success: true,
        message: `Found ${claims.length} task claims`,
        data: claims
      });
    } catch (error) {
      console.error('❌ Error getting task claims:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get task claims',
        error: error.message
      });
    }
  }
}

module.exports = TaskController;
