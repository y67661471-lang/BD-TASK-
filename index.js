const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

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

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

app.get('/status', (req, res) => {
  res.json({
    active: true,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

try {
  app.use('/api', require('./src/routes/index'));
} catch (e) {
  console.log('API routes not found, skipping');
}

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;