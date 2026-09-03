/**
 * Withdrawal Model
 * Handles withdrawal-related database operations
 */

const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Withdrawal {
  /**
   * Create a new withdrawal request
   */
  static async create(withdrawalData) {
    const query = `
      INSERT INTO withdrawals (
        id, user_id, amount, payment_method, payment_method_detail,
        status, risk_score, robot_decision
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      uuidv4(),
      withdrawalData.user_id,
      withdrawalData.amount,
      withdrawalData.payment_method,
      JSON.stringify(withdrawalData.payment_method_detail),
      withdrawalData.status || 'pending',
      withdrawalData.risk_score || 0,
      withdrawalData.robot_decision || null
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get withdrawal by ID
   */
  static async getById(withdrawalId) {
    const query = 'SELECT * FROM withdrawals WHERE id = $1';
    const result = await pool.query(query, [withdrawalId]);
    return result.rows[0] || null;
  }

  /**
   * Get user withdrawals
   */
  static async getUserWithdrawals(userId, status = null) {
    let query = 'SELECT * FROM withdrawals WHERE user_id = $1';
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
   * Update withdrawal status
   */
  static async updateStatus(withdrawalId, status, options = {}) {
    let query = `
      UPDATE withdrawals SET
        status = $1,
        updated_at = CURRENT_TIMESTAMP
    `;
    const values = [status, withdrawalId];
    let paramCount = 2;

    if (options.verification_note) {
      query += `, verification_note = $${paramCount + 1}`;
      values.push(options.verification_note);
      paramCount++;
    }

    if (options.hold_reason) {
      query += `, hold_reason = $${paramCount + 1}, hold_until = CURRENT_TIMESTAMP + INTERVAL '${options.hold_days || 7} days'`;
      values.push(options.hold_reason);
      paramCount++;
    }

    if (options.rejection_reason) {
      query += `, rejection_reason = $${paramCount + 1}`;
      values.push(options.rejection_reason);
      paramCount++;
    }

    if (options.payment_confirmation_id) {
      query += `, payment_confirmation_id = $${paramCount + 1}, paid_at = CURRENT_TIMESTAMP`;
      values.push(options.payment_confirmation_id);
      paramCount++;
    }

    query += ` WHERE id = $${paramCount + 1} RETURNING *`;
    values.push(withdrawalId);
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get pending withdrawals
   */
  static async getPendingWithdrawals() {
    const query = `
      SELECT * FROM withdrawals
      WHERE status = 'pending'
      ORDER BY created_at ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Get held withdrawals
   */
  static async getHeldWithdrawals() {
    const query = `
      SELECT * FROM withdrawals
      WHERE status = 'held' AND hold_until > CURRENT_TIMESTAMP
      ORDER BY hold_until ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Get withdrawal statistics
   */
  static async getStatistics() {
    const query = `
      SELECT
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN status = 'held' THEN 1 END) as held_count,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_amount,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_paid
      FROM withdrawals
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }
}

module.exports = Withdrawal;
