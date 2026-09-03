const jwt = require('jsonwebtoken');
const database = require('../config/database');

// Verify Telegram Init-Data
const verifyTelegramInitData = async (req, res, next) => {
  try {
    const { initData } = req.body || req.headers;

    if (!initData) {
      return res.status(401).json({ success: false, message: 'Missing init data' });
    }

    // Parse and verify init-data (simplified)
    const params = new URLSearchParams(initData);
    const telegramId = params.get('user')?.split('"id":')[1]?.split(',')[0];

    if (!telegramId) {
      return res.status(401).json({ success: false, message: 'Invalid init data' });
    }

    const user = await database.query(
      'SELECT id, telegram_id, username FROM users WHERE telegram_id = $1',
      [parseInt(telegramId)]
    );

    if (user.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user.rows[0];
    next();
  } catch (error) {
    console.error('Telegram verification error:', error);
    res.status(401).json({ success: false, message: 'Verification failed' });
  }
};

// JWT Verification
const verifyJWT = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Missing token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Admin Verification
const verifyAdmin = async (req, res, next) => {
  try {
    const result = await database.query(
      'SELECT role FROM admin_users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0 || result.rows[0].role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    next();
  } catch (error) {
    res.status(403).json({ success: false, message: 'Permission denied' });
  }
};

module.exports = {
  verifyTelegramInitData,
  verifyJWT,
  verifyAdmin,
};
