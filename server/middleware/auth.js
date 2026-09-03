/**
 * Authentication Middleware
 */

const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Verify JWT Token
 */
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message
    });
  }
};

/**
 * Verify Telegram Init Data
 */
const verifyTelegramData = (req, res, next) => {
  try {
    const initData = req.body.init_data;

    if (!initData) {
      return res.status(401).json({
        success: false,
        message: 'Telegram init data is required'
      });
    }

    // In production, verify the signature
    // For now, just parse and validate basic structure
    const params = new URLSearchParams(initData);
    const userData = JSON.parse(params.get('user') || '{}');

    if (!userData.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Telegram user data'
      });
    }

    req.telegram = {
      user: userData,
      init_data: initData,
      auth_date: params.get('auth_date')
    };

    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to parse Telegram data',
      error: error.message
    });
  }
};

/**
 * Admin Authentication Middleware
 */
const verifyAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required'
      });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);

    if (!decoded.is_admin || !['super_admin', 'admin', 'moderator'].includes(decoded.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid admin token'
    });
  }
};

module.exports = {
  verifyToken,
  verifyTelegramData,
  verifyAdmin
};
