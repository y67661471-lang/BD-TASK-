const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const database = require('./config/database');
const redis = require('./config/redis');
const telegramBot = require('./config/telegram');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/task', require('./routes/task'));
app.use('/api/reward', require('./routes/reward'));
app.use('/api/withdrawal', require('./routes/withdrawal'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/security', require('./routes/security'));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
async function startServer() {
  try {
    // Test Database Connection
    await database.query('SELECT 1');
    console.log('✅ Database connected');

    // Test Redis Connection
    await redis.ping();
    console.log('✅ Redis connected');

    // Start Telegram Bot
    telegramBot.launch();
    console.log('✅ Telegram Bot started');

    // Start Express Server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
