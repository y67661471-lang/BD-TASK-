/**
 * Health Check Routes
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Health check
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    return res.status(200).json({
      success: true,
      message: 'Server is healthy',
      timestamp: new Date(),
      uptime: process.uptime()
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      message: 'Server is unhealthy',
      error: error.message
    });
  }
});

// API version
router.get('/version', (req, res) => {
  return res.status(200).json({
    success: true,
    version: '1.0.0',
    name: 'BD-TASK API',
    timestamp: new Date()
  });
});

module.exports = router;
