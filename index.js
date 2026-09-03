const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Root Endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'Server is running',
    message: 'BDTASK Bot API is online',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      status: '/status',
      api: '/api'
    }
  });
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Status Endpoint
app.get('/status', (req, res) => {
  res.json({
    active: true,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API Routes
try {
  app.use('/api', require('./src/routes/index'));
} catch (e) {
  console.log('API routes not found, skipping');
}

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;