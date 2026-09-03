const redis = require('../config/redis');

// Rate Limiting per User
const rateLimitUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const key = `rate_limit:${userId}`;

    const count = await redis.incr(key);
    await redis.expire(key, 60); // 1 minute window

    if (count > 50) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
      });
    }

    next();
  } catch (error) {
    console.error('Rate limit error:', error);
    next();
  }
};

// Detect Suspicious Behavior
const detectSuspiciousBehavior = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const timestamp = Date.now();

    // Store activity log
    const activityKey = `activity:${userId}`;
    const activities = await redis.lrange(activityKey, 0, -1);

    const recentActivities = activities
      .map(JSON.parse)
      .filter((a) => timestamp - a.timestamp < 5000); // Last 5 seconds

    if (recentActivities.length > 10) {
      // Suspicious rapid activity
      req.riskScore = (req.riskScore || 0) + 25;
    }

    // Add new activity
    await redis.lpush(
      activityKey,
      JSON.stringify({ timestamp, action: req.method + ' ' + req.path })
    );
    await redis.expire(activityKey, 3600); // Keep for 1 hour

    next();
  } catch (error) {
    console.error('Suspicious behavior detection error:', error);
    next();
  }
};

// Log Security Events
const logSecurityEvent = async (userId, eventType, details, riskScore) => {
  try {
    const database = require('../config/database');
    await database.query(
      `INSERT INTO security_events (user_id, event_type, details, risk_score, timestamp)
       VALUES ($1, $2, $3, $4, NOW())`,
      [userId, eventType, JSON.stringify(details), riskScore || 0]
    );
  } catch (error) {
    console.error('Error logging security event:', error);
  }
};

module.exports = {
  rateLimitUser,
  detectSuspiciousBehavior,
  logSecurityEvent,
};
