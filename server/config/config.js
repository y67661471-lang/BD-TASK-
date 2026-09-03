/**
 * Environment Configuration
 */

require('dotenv').config();

const config = {
  // Server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  SECRET_KEY: process.env.SECRET_KEY || 'your-super-secret-key',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/bd_task_db',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',

  // Telegram
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_BOT_USERNAME: process.env.TELEGRAM_BOT_USERNAME,

  // Security
  MAX_RISK_SCORE: parseInt(process.env.MAX_RISK_SCORE) || 100,
  FRAUD_THRESHOLD: parseInt(process.env.FRAUD_THRESHOLD) || 85,
  WARNING_THRESHOLD: parseInt(process.env.WARNING_THRESHOLD) || 50,

  // Admin
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@example.com',

  // Payment
  PAYMENT_GATEWAY: process.env.PAYMENT_GATEWAY || 'bkash',
  PAYMENT_API_KEY: process.env.PAYMENT_API_KEY,

  // Frontend
  REACT_APP_API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  REACT_APP_BOT_USERNAME: process.env.REACT_APP_BOT_USERNAME,

  // Email
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
};

module.exports = config;
