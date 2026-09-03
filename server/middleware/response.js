/**
 * Error Handling Middleware
 */

const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
};

/**
 * Not Found Middleware
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
};

/**
 * Success Response Formatter
 */
const successResponse = (data, message = 'Success', statusCode = 200) => {
  return {
    success: true,
    message,
    statusCode,
    data
  };
};

/**
 * Error Response Formatter
 */
const errorResponse = (message = 'Error', statusCode = 400, error = null) => {
  return {
    success: false,
    message,
    statusCode,
    error
  };
};

module.exports = {
  errorHandler,
  notFound,
  successResponse,
  errorResponse
};
