/**
 * Request Validation Middleware
 */

const { body, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * Validate withdrawal request
 */
const validateWithdrawal = [
  body('amount')
    .isFloat({ min: 10, max: 500 })
    .withMessage('Withdrawal amount must be between 10 and 500'),
  body('payment_method')
    .isIn(['bkash', 'nagad', 'paypal', 'crypto'])
    .withMessage('Invalid payment method'),
  body('payment_method_detail')
    .notEmpty()
    .withMessage('Payment method detail is required'),
  handleValidationErrors
];

/**
 * Validate task claim
 */
const validateTaskClaim = [
  body('task_id')
    .isUUID()
    .withMessage('Invalid task ID'),
  body('token')
    .notEmpty()
    .withMessage('Token is required'),
  handleValidationErrors
];

/**
 * Validate admin login
 */
const validateAdminLogin = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateWithdrawal,
  validateTaskClaim,
  validateAdminLogin
};
