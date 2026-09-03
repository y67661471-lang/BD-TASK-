/**
 * Rate Limiting Configuration
 */

const rateLimit = require('express-rate-limit');

/**
 * General rate limiter
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later'
});

/**
 * Strict rate limiter for auth endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later'
});

/**
 * Withdrawal rate limiter
 */
const withdrawalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Maximum withdrawal requests per hour exceeded'
});

module.exports = {
  generalLimiter,
  authLimiter,
  withdrawalLimiter
};
