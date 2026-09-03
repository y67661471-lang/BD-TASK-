/**
 * Token Verification System
 * Generates and validates one-time use tokens for tasks
 */

const crypto = require('crypto');
const pool = require('../config/database');

class TokenManager {
  /**
   * Generate unique task token
   */
  static generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create token for task claim
   */
  static async createToken(claimId) {
    try {
      const token = this.generateToken();
      const expiresIn = 3 * 60 * 60 * 1000; // 3 hours
      const expiresAt = new Date(Date.now() + expiresIn);

      return {
        token,
        expires_at: expiresAt,
        expires_in_seconds: expiresIn / 1000
      };
    } catch (error) {
      console.error('❌ Error creating token:', error);
      throw error;
    }
  }

  /**
   * Verify token validity
   */
  static async verifyToken(token) {
    try {
      const result = await pool.query(`
        SELECT * FROM task_claims
        WHERE token = $1
        AND token_expires_at > CURRENT_TIMESTAMP
        AND is_token_used = false
      `, [token]);

      if (result.rows.length === 0) {
        return {
          valid: false,
          error: 'Token not found, expired, or already used'
        };
      }

      const claim = result.rows[0];
      return {
        valid: true,
        claim_id: claim.id,
        user_id: claim.user_id,
        task_id: claim.task_id,
        expires_at: claim.token_expires_at
      };
    } catch (error) {
      console.error('❌ Error verifying token:', error);
      return {
        valid: false,
        error: 'Token verification failed'
      };
    }
  }

  /**
   * Mark token as used
   */
  static async markTokenUsed(token, completionData = {}) {
    try {
      const result = await pool.query(`
        UPDATE task_claims
        SET 
          is_token_used = true,
          completed_at = CURRENT_TIMESTAMP,
          provider_response = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE token = $2 AND is_token_used = false
        RETURNING *
      `, [JSON.stringify(completionData), token]);

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Token already used or not found'
        };
      }

      return {
        success: true,
        claim: result.rows[0]
      };
    } catch (error) {
      console.error('❌ Error marking token as used:', error);
      return {
        success: false,
        error: 'Failed to mark token as used'
      };
    }
  }

  /**
   * Invalidate expired tokens
   */
  static async cleanupExpiredTokens() {
    try {
      const result = await pool.query(`
        UPDATE task_claims
        SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
        WHERE token_expires_at <= CURRENT_TIMESTAMP
        AND is_token_used = false
        AND status IN ('started', 'pending')
      `);

      console.log(`✅ Cleaned up ${result.rowCount} expired tokens`);
      return result.rowCount;
    } catch (error) {
      console.error('❌ Error cleaning up tokens:', error);
      return 0;
    }
  }
}

module.exports = TokenManager;
