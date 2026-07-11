require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const prisma = require('./db');
const { initCron } = require('./jobs/cron');
const { initSocket } = require('./sockets/realtime');

const authRoutes     = require('./routes/auth');
const stationRoutes  = require('./routes/stations');
const readingRoutes  = require('./routes/readings');
const alertRoutes    = require('./routes/alerts');
const trendRoutes    = require('./routes/trends');
const reportRoutes   = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const httpServer = http.createServer(app);

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth',      authRoutes);
app.use('/api/stations',  stationRoutes);
app.use('/api/readings',  readingRoutes);
app.use('/api/alerts',    alertRoutes);
app.use('/api/stations',  trendRoutes);
app.use('/api/reports',   reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', code: 'NOT_FOUND' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error', code: 'SERVER_ERROR' });
});

const PORT = process.env.PORT || 5000;

async function start() {
  // 1. Verify MySQL connection before doing anything else
  console.log('──────────────────────────────────────────');
  console.log('  Verifying MySQL connection via Prisma...');
  try {
    await prisma.$connect();
    console.log('  ✔  Database connection successful.');
  } catch (err) {
    console.error('  ✘  Cannot connect to MySQL.');
    console.error('  Error:', err.message);
    console.error();
    console.error('  Checklist:');
    console.error('  1. MySQL is running');
    console.error('  2. DATABASE_URL in .env is correct');
    console.error('  3. Database "groundwater_db" exists');
    console.error('──────────────────────────────────────────');
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log('──────────────────────────────────────────');

  // 2. Seed default data if tables are empty
  await require('./db/seed')();

  // 3. Attach Socket.io and start listening
  initSocket(httpServer);
  httpServer.listen(PORT, () => {
    console.log(`Groundwater API + WebSocket server running on port ${PORT}`);
    initCron();
  });
}

start();

module.exports = { app, httpServer };
