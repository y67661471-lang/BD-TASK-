/**
 * Authentication Controller
 * Handles user login and token generation
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const AdminUser = require('../models/AdminUser');
const config = require('../config/config');
const pool = require('../config/database');

class AuthController {
  /**
   * Telegram Mini App Login
   */
  static async telegramLogin(req, res) {
    try {
      const { init_data } = req.body;

      if (!init_data) {
        return res.status(400).json({
          success: false,
          message: 'init_data is required'
        });
      }

      // Parse Telegram init data
      const params = new URLSearchParams(init_data);
      const userData = JSON.parse(params.get('user') || '{}');
      const authDate = parseInt(params.get('auth_date') || 0);

      if (!userData.id) {
        return res.status(401).json({
          success: false,
          message: 'Invalid Telegram user data'
        });
      }

      // Verify auth_date (shouldn't be older than 1 hour)
      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime - authDate > 3600) {
        return res.status(401).json({
          success: false,
          message: 'Telegram data expired'
        });
      }

      // Create or update user
      const user = await User.createOrUpdate({
        id: userData.id,
        first_name: userData.first_name,
        last_name: userData.last_name,
        username: userData.username,
        photo_url: userData.photo_url,
        device_fingerprint: req.body.device_fingerprint || null,
        ip_address: req.ip
      });

      // Create session
      const session = await pool.query(`
        INSERT INTO telegram_sessions (id, user_id, telegram_id, init_data, expires_at, device_info)
        VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days', $5)
        RETURNING *
      `, [
        uuidv4(),
        user.id,
        userData.id,
        init_data,
        JSON.stringify({
          user_agent: req.get('user-agent'),
          ip_address: req.ip
        })
      ]);

      // Generate JWT token
      const token = jwt.sign(
        {
          user_id: user.id,
          telegram_id: userData.id,
          username: userData.username,
          type: 'user'
        },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRE }
      );

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          telegram_id: user.telegram_id,
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          status: user.status,
          risk_score: user.risk_score
        }
      });
    } catch (error) {
      console.error('❌ Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  }

  /**
   * Admin Login
   */
  static async adminLogin(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Get admin by email
      const result = await pool.query(
        'SELECT * FROM admin_users WHERE email = $1 AND is_active = true',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const admin = result.rows[0];

      // Verify password
      const passwordMatch = await bcrypt.compare(password, admin.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          admin_id: admin.id,
          email: admin.email,
          role: admin.role,
          type: 'admin',
          is_admin: true
        },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRE }
      );

      // Update last login
      await pool.query(
        'UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
        [admin.id]
      );

      return res.status(200).json({
        success: true,
        message: 'Admin login successful',
        token,
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (error) {
      console.error('❌ Admin login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  }

  /**
   * Verify Token
   */
  static async verifyToken(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'No token provided'
        });
      }

      const decoded = jwt.verify(token, config.JWT_SECRET);

      return res.status(200).json({
        success: true,
        message: 'Token is valid',
        decoded
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  }

  /**
   * Logout
   */
  static async logout(req, res) {
    try {
      // In a real app, you might want to invalidate the token in a blacklist
      return res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }
}

class AdminUser {
  // This is a placeholder for admin user model
  // In production, this should be in a separate model file
}

module.exports = AuthController;
