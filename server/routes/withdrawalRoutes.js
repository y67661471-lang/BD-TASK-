/**
 * Withdrawal Routes
 */

const express = require('express');
const router = express.Router();
const WithdrawalController = require('../controllers/withdrawalController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { validateWithdrawal } = require('../middleware/validation');

// User routes (require authentication)
router.post('/request', verifyToken, validateWithdrawal, WithdrawalController.requestWithdrawal);
router.get('/list', verifyToken, WithdrawalController.getUserWithdrawals);
router.get('/:withdrawal_id', verifyToken, WithdrawalController.getWithdrawal);

// Admin routes (require admin authentication)
router.delete('/:withdrawal_id', verifyAdmin, WithdrawalController.cancelWithdrawal);
router.post('/:withdrawal_id/approve', verifyAdmin, WithdrawalController.approveWithdrawal);

module.exports = router;
