/**
 * Automatic Reward Engine
 * Handles automatic reward processing with security checks
 */

const pool = require('../config/database');
const config = require('../config/config');
const SecurityMonitor = require('./securityMonitor');
const Reward = require('../models/Reward');

class RewardEngine {
  /**
   * Process task completion and award reward
   */
  static async processTaskReward(claimId, userId, taskId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get task details
      const taskQuery = await client.query(
        'SELECT reward FROM tasks WHERE id = $1',
        [taskId]
      );
      const reward = parseFloat(taskQuery.rows[0].reward);

      // Monitor task completion for security
      const securityResult = await SecurityMonitor.monitorTaskCompletion(claimId, userId, taskId);

      let rewardStatus = 'available';
      let holdReason = null;

      if (securityResult.action === 'hold') {
        rewardStatus = 'held';
        holdReason = 'Security verification in progress';
      } else if (securityResult.action === 'verify') {
        rewardStatus = 'pending';
      } else if (securityResult.action === 'block') {
        rewardStatus = 'rejected';
        await client.query('COMMIT');
        return {
          success: false,
          status: 'rejected',
          reason: 'Failed fraud check'
        };
      }

      // Create reward record
      const rewardId = require('uuid').v4();
      await client.query(`
        INSERT INTO rewards (
          id, user_id, task_claim_id, amount, reward_type, status, robot_decision, hold_reason
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        rewardId,
        userId,
        claimId,
        reward,
        'task',
        rewardStatus,
        securityResult.action,
        holdReason
      ]);

      // Update user balance if reward is immediately available
      if (rewardStatus === 'available') {
        await client.query(`
          UPDATE users
          SET 
            available_balance = available_balance + $1,
            total_earned = total_earned + $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [reward, userId]);
      } else if (rewardStatus === 'pending') {
        await client.query(`
          UPDATE users
          SET 
            pending_balance = pending_balance + $1,
            total_earned = total_earned + $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [reward, userId]);
      } else if (rewardStatus === 'held') {
        await client.query(`
          UPDATE users
          SET 
            held_balance = held_balance + $1,
            total_earned = total_earned + $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [reward, userId]);
      }

      // Log transaction
      await client.query(`
        INSERT INTO wallet_transactions (
          id, user_id, transaction_type, amount, description
        ) VALUES (gen_random_uuid(), $1, $2, $3, $4)
      `, [userId, 'credit', reward, `Task ${taskId} completion reward`]);

      await client.query('COMMIT');

      return {
        success: true,
        reward_id: rewardId,
        amount: reward,
        status: rewardStatus,
        security_check: securityResult
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error processing task reward:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      client.release();
    }
  }

  /**
   * Release held rewards
   */
  static async releaseHeldRewards() {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get all held rewards that should be released
      const heldRewards = await client.query(`
        SELECT id, user_id, amount FROM rewards
        WHERE status = 'held' AND hold_until <= CURRENT_TIMESTAMP
      `);

      for (const reward of heldRewards.rows) {
        // Update reward status
        await client.query(`
          UPDATE rewards SET status = 'available', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [reward.id]);

        // Update user balance
        await client.query(`
          UPDATE users
          SET 
            held_balance = held_balance - $1,
            available_balance = available_balance + $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [reward.amount, reward.user_id]);

        // Log transaction
        await client.query(`
          INSERT INTO wallet_transactions (
            id, user_id, transaction_type, amount, description
          ) VALUES (gen_random_uuid(), $1, $2, $3, $4)
        `, [reward.user_id, 'release', reward.amount, 'Held reward released']);
      }

      await client.query('COMMIT');
      console.log(`✅ Released ${heldRewards.rows.length} held rewards`);
      return heldRewards.rows.length;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error releasing held rewards:', error);
      return 0;
    } finally {
      client.release();
    }
  }
}

module.exports = RewardEngine;
