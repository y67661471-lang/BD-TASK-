/**
 * User Routes
 */

const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Get user profile
router.get('/profile', UserController.getProfile);

// Get user balance
router.get('/balance', UserController.getBalance);

// Get user statistics
router.get('/stats', UserController.getStats);

// Update user profile
router.put('/profile', UserController.updateProfile);

// Get security status
router.get('/security-status', UserController.getSecurityStatus);

module.exports = router;
