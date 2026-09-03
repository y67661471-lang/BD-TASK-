/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { verifyTelegramData } = require('../middleware/auth');
const { authLimiter } = require('../config/rateLimiter');

// Telegram Mini App Login
router.post('/telegram-login', authLimiter, verifyTelegramData, AuthController.telegramLogin);

// Admin Login
router.post('/admin-login', authLimiter, AuthController.adminLogin);

// Verify Token
router.post('/verify-token', AuthController.verifyToken);

// Logout
router.post('/logout', AuthController.logout);

module.exports = router;
