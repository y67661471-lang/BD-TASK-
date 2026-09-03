/**
 * User Model
 * Handles user-related database operations
 */

const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class User {
  /**
   * Create or get user from Telegram data
   */
  static async createOrUpdate(telegramData) {
    const query = `
      INSERT INTO users (
        id, telegram_id, first_name, last_name, username, avatar_url, device_fingerprint, ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (telegram_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        username = EXCLUDED.username,
        avatar_url = EXCLUDED.avatar_url,
        last_activity_at = CURRENT_TIMESTAMP,
        device_fingerprint = EXCLUDED.device_fingerprint,
        ip_address = EXCLUDED.ip_address
      RETURNING *;
    `;

    const values = [
      uuidv4(),
      telegramData.id,
      telegramData.first_name || null,
      telegramData.last_name || null,
      telegramData.username || null,
      telegramData.photo_url || null,
      telegramData.device_fingerprint || null,
      telegramData.ip_address || null
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get user by ID
   */
  static async getById(userId) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Get user by Telegram ID
   */
  static async getByTelegramId(telegramId) {
    const query = 'SELECT * FROM users WHERE telegram_id = $1';
    const result = await pool.query(query, [telegramId]);
    return result.rows[0] || null;
  }

  /**
   * Get user balance
   */
  static async getBalance(userId) {
    const query = `
      SELECT 
        available_balance,
        pending_balance,
        held_balance,
        total_earned,
        total_withdrawn
      FROM users WHERE id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Update balance
   */
  static async updateBalance(userId, available, pending, held) {
    const query = `
      UPDATE users SET
        available_balance = $1,
        pending_balance = $2,
        held_balance = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING available_balance, pending_balance, held_balance
    `;
    const result = await pool.query(query, [available, pending, held, userId]);
    return result.rows[0];
  }

  /**
   * Update risk score
   */
  static async updateRiskScore(userId, score) {
    const query = `
      UPDATE users SET
        risk_score = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING risk_score, status
    `;
    const result = await pool.query(query, [score, userId]);
    return result.rows[0];
  }

  /**
   * Update user status
   */
  static async updateStatus(userId, status) {
    const query = `
      UPDATE users SET
        status = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING status
    `;
    const result = await pool.query(query, [status, userId]);
    return result.rows[0];
  }

  /**
   * Get all users with pagination
   */
  static async getAllUsers(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT * FROM users
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  /**
   * Get user statistics
   */
  static async getStatistics() {
    const query = `
      SELECT
        COUNT(*) as total_users,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
        COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_users,
        COUNT(CASE WHEN status = 'banned' THEN 1 END) as banned_users,
        COUNT(CASE WHEN risk_score >= 71 THEN 1 END) as high_risk_users,
        COALESCE(SUM(total_earned), 0) as total_rewards_issued,
        COALESCE(SUM(total_withdrawn), 0) as total_paid
      FROM users
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }

  /**
   * Get suspicious users
   */
  static async getSuspiciousUsers(minRiskScore = 50) {
    const query = `
      SELECT * FROM users
      WHERE risk_score >= $1
      ORDER BY risk_score DESC
    `;
    const result = await pool.query(query, [minRiskScore]);
    return result.rows;
  }
}

module.exports = User;
