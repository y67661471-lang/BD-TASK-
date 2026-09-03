/**
 * Task Routes
 */

const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Get available tasks
router.get('/available', TaskController.getAvailableTasks);

// Start a task
router.post('/start', TaskController.startTask);

// Complete a task
router.post('/complete', TaskController.completeTask);

// Get user's task claims
router.get('/claims', TaskController.getUserClaims);

module.exports = router;
