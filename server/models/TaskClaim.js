/**
 * TaskClaim Model
 * Handles task claim-related database operations
 */

const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class TaskClaim {
  /**
   * Create a new task claim
   */
  static async create(claimData) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours

    const query = `
      INSERT INTO task_claims (
        id, user_id, task_id, status, token, token_expires_at,
        verification_method, risk_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      uuidv4(),
      claimData.user_id,
      claimData.task_id,
      'started',
      token,
      tokenExpiry,
      claimData.verification_method || 'automatic',
      0
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get claim by ID
   */
  static async getById(claimId) {
    const query = 'SELECT * FROM task_claims WHERE id = $1';
    const result = await pool.query(query, [claimId]);
    return result.rows[0] || null;
  }

  /**
   * Get claim by token
   */
  static async getByToken(token) {
    const query = `
      SELECT * FROM task_claims
      WHERE token = $1
      AND token_expires_at > CURRENT_TIMESTAMP
      AND is_token_used = false
    `;
    const result = await pool.query(query, [token]);
    return result.rows[0] || null;
  }

  /**
   * Update claim status
   */
  static async updateStatus(claimId, status, options = {}) {
    let query = `
      UPDATE task_claims SET
        status = $1,
        updated_at = CURRENT_TIMESTAMP
    `;
    const values = [status, claimId];
    let paramCount = 2;

    if (options.completed_at) {
      query += `, completed_at = CURRENT_TIMESTAMP`;
    }

    if (options.verified_at) {
      query += `, verified_at = CURRENT_TIMESTAMP`;
    }

    if (options.reward_amount !== undefined) {
      query += `, reward_amount = $${paramCount + 1}`;
      values.push(options.reward_amount);
      paramCount++;
    }

    if (options.risk_score !== undefined) {
      query += `, risk_score = $${paramCount + 1}`;
      values.push(options.risk_score);
      paramCount++;
    }

    if (options.rejection_reason) {
      query += `, rejection_reason = $${paramCount + 1}`;
      values.push(options.rejection_reason);
      paramCount++;
    }

    if (options.provider_response) {
      query += `, provider_response = $${paramCount + 1}`;
      values.push(JSON.stringify(options.provider_response));
      paramCount++;
    }

    query += ` WHERE id = $${paramCount + 1} RETURNING *`;
    values.push(claimId);
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Mark token as used
   */
  static async markTokenUsed(token) {
    const query = `
      UPDATE task_claims SET
        is_token_used = true,
        completed_at = CURRENT_TIMESTAMP
      WHERE token = $1
      RETURNING *
    `;
    const result = await pool.query(query, [token]);
    return result.rows[0];
  }

  /**
   * Get user's task claims
   */
  static async getUserClaims(userId, status = null) {
    let query = 'SELECT * FROM task_claims WHERE user_id = $1';
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
   * Check if user already claimed task
   */
  static async hasUserClaimedTask(userId, taskId) {
    const query = `
      SELECT COUNT(*) FROM task_claims
      WHERE user_id = $1 AND task_id = $2 AND status = 'verified'
    `;
    const result = await pool.query(query, [userId, taskId]);
    return parseInt(result.rows[0].count) > 0;
  }

  /**
   * Get claim statistics
   */
  static async getStatistics() {
    const query = `
      SELECT
        COUNT(*) as total_claims,
        COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified_claims,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_claims,
        COUNT(CASE WHEN status = 'held' THEN 1 END) as held_claims,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_claims,
        COALESCE(AVG(risk_score), 0) as avg_risk_score
      FROM task_claims
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }
}

module.exports = TaskClaim;
