/**
 * Admin Routes
 */

const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { verifyAdmin } = require('../middleware/auth');
const { validateAdminLogin } = require('../middleware/validation');

// All admin routes require admin authentication
router.use(verifyAdmin);

// Dashboard
router.get('/dashboard', AdminController.getDashboard);

// User management
router.get('/users', AdminController.getAllUsers);
router.get('/users/suspicious', AdminController.getSuspiciousUsers);
router.put('/users/:user_id/ban', AdminController.banUser);

// Security monitoring
router.get('/security/alerts', AdminController.getSecurityAlerts);

// Withdrawal management
router.get('/withdrawals', AdminController.getWithdrawals);
router.post('/withdrawals/:withdrawal_id/approve', AdminController.approveWithdrawal);

// Task management
router.post('/tasks', AdminController.createTask);
router.put('/tasks/:task_id', AdminController.updateTask);
router.delete('/tasks/:task_id', AdminController.deleteTask);

module.exports = router;
