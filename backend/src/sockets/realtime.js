const { Server } = require('socket.io');

let io = null;

/**
 * Attach Socket.io to the HTTP server and configure rooms + event handlers.
 * Call once from app.js after httpServer is created.
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Client joins the dashboard room by default (summary-level events)
    socket.join('dashboard');

    // Client can join a specific station room for detailed events
    socket.on('join:station', (stationId) => {
      const room = `station:${stationId}`;
      socket.join(room);
      console.log(`[Socket.io] ${socket.id} joined ${room}`);
    });

    socket.on('leave:station', (stationId) => {
      const room = `station:${stationId}`;
      socket.leave(room);
      console.log(`[Socket.io] ${socket.id} left ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  console.log('[Socket.io] Real-time server initialised.');
  return io;
}

/** Emit a new reading to the dashboard room and the station-specific room */
function emitReadingNew(payload) {
  if (!io) return;
  const event = 'reading:new';
  io.to('dashboard').emit(event, payload);
  io.to(`station:${payload.station_id}`).emit(event, payload);
}

/** Emit updated trend data after analysis */
function emitTrendUpdated(payload) {
  if (!io) return;
  const event = 'trend:updated';
  io.to('dashboard').emit(event, payload);
  io.to(`station:${payload.station_id}`).emit(event, payload);
}

/** Emit a new alert to all dashboard clients */
function emitAlertNew(payload) {
  if (!io) return;
  io.to('dashboard').emit('alert:new', payload);
  io.to(`station:${payload.station_id}`).emit('alert:new', payload);
}

/** Emit alert resolved to all dashboard clients */
function emitAlertResolved(payload) {
  if (!io) return;
  io.to('dashboard').emit('alert:resolved', payload);
  io.to(`station:${payload.station_id}`).emit('alert:resolved', payload);
}

module.exports = {
  initSocket,
  emitReadingNew,
  emitTrendUpdated,
  emitAlertNew,
  emitAlertResolved,
};
