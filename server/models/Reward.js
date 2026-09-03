/**
 * Reward Model
 * Handles reward-related database operations
 */

const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Reward {
  /**
   * Create a new reward
   */
  static async create(rewardData) {
    const query = `
      INSERT INTO rewards (
        id, user_id, task_claim_id, amount, reward_type, status, reason, robot_decision, audit_log
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      uuidv4(),
      rewardData.user_id,
      rewardData.task_claim_id || null,
      rewardData.amount,
      rewardData.reward_type || 'task',
      rewardData.status || 'pending',
      rewardData.reason || null,
      rewardData.robot_decision || null,
      JSON.stringify(rewardData.audit_log || {})
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get reward by ID
   */
  static async getById(rewardId) {
    const query = 'SELECT * FROM rewards WHERE id = $1';
    const result = await pool.query(query, [rewardId]);
    return result.rows[0] || null;
  }

  /**
   * Get user rewards
   */
  static async getUserRewards(userId, status = null) {
    let query = 'SELECT * FROM rewards WHERE user_id = $1';
    const values = [userId];

    if (status) {
      query += ' AND status = $2';
      values.push(status);
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Update reward status
   */
  static async updateStatus(rewardId, status, holdReason = null) {
    let query = `
      UPDATE rewards SET
        status = $1,
        updated_at = CURRENT_TIMESTAMP
    `;
    const values = [status, rewardId];

    if (holdReason) {
      query += `, hold_reason = $2, hold_until = CURRENT_TIMESTAMP + INTERVAL '7 days'`;
      values[1] = holdReason;
      values.push(rewardId);
    }

    query += ` WHERE id = $${values.length - 1} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get pending rewards
   */
  static async getPendingRewards(userId) {
    const query = `
      SELECT * FROM rewards
      WHERE user_id = $1 AND status = 'pending'
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Get held rewards
   */
  static async getHeldRewards(userId) {
    const query = `
      SELECT * FROM rewards
      WHERE user_id = $1 AND status = 'held'
      ORDER BY hold_until DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Release held rewards
   */
  static async releaseHeldRewards() {
    const query = `
      UPDATE rewards SET
        status = 'available',
        updated_at = CURRENT_TIMESTAMP
      WHERE status = 'held' AND hold_until <= CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Get reward statistics
   */
  static async getStatistics() {
    const query = `
      SELECT
        COUNT(*) as total_rewards,
        COALESCE(SUM(CASE WHEN status = 'available' THEN amount ELSE 0 END), 0) as available_rewards,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_rewards,
        COALESCE(SUM(CASE WHEN status = 'held' THEN amount ELSE 0 END), 0) as held_rewards,
        COALESCE(SUM(CASE WHEN status IN ('available', 'paid') THEN amount ELSE 0 END), 0) as total_issued
      FROM rewards
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }
}

module.exports = Reward;
