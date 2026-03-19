import express, { Application } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Configuration
import { connectDatabase, disconnectDatabase } from './config/database';
import logger from './config/logger';
import { verifyEmailConnection } from './config/email';

// Middleware
import { errorHandler, notFoundHandler } from './shared/middleware/error.middleware';

// Routes
import authRoutes from './modules/auth/auth.routes';
import gameRoutes from './modules/game/game.routes';
import loungeRoutes from './modules/lounge/lounge.routes';
import userRoutes from './modules/user/user.routes';
import coinRoutes from './modules/coin/coin.routes';
import rankingRoutes from './modules/ranking/ranking.routes';
import messageRoutes from './modules/message/message.routes';
import withdrawalRoutes from './modules/withdrawal/withdrawal.routes';

// WebSocket Gateway
import GameGateway from './modules/game/game.gateway';

// Load environment variables
dotenv.config();

const app: Application = express();
const server = http.createServer(app);

// Socket.IO configuration
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: Number(process.env.WS_PING_TIMEOUT) || 5000,
  pingInterval: Number(process.env.WS_PING_INTERVAL) || 25000
});

// Basic middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });
}

// Health check 엔드포인트
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    port: process.env.PORT
  });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Naipes Backend API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.get('/api', (_req, res) => {
  res.json({
    message: 'Naipes Negros Backend API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        refresh: 'POST /api/auth/refresh',
        me: 'GET /api/auth/me',
      },
      health: 'GET /api/health',
    },
  });
});

// Register module routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/lounge', loungeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/coins', coinRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/withdrawals', withdrawalRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });

  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });

  // Authentication event
  socket.on('authenticate', (_data) => {
    logger.info('Socket authentication request', { socketId: socket.id });
    // TODO: Add JWT token verification logic
    socket.emit('authenticated', { success: true });
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (register last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Verify email connection
    await verifyEmailConnection();

    // Initialize WebSocket Game Gateway
    new GameGateway(io);
    logger.info('Game WebSocket gateway initialized');

    // Start server
    server.listen(PORT, () => {
      console.log('========================================');
      console.log('🎮 Naipes Negros Backend Server');
      console.log('========================================');
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Server running on: http://${HOST}:${PORT}`);
      console.log(`Health check: http://${HOST}:${PORT}/health`);
      console.log(`API docs: http://${HOST}:${PORT}/api`);
      console.log(`WebSocket: ws://${HOST}:${PORT}`);
      console.log('========================================');
      console.log('Available endpoints:');
      console.log('  POST /api/auth/register - User registration');
      console.log('  POST /api/auth/login - User login');
      console.log('  POST /api/auth/refresh - Refresh token');
      console.log('  GET  /api/auth/me - Get current user');
      console.log('  POST /api/auth/recover - Request password reset');
      console.log('  POST /api/auth/reset-password - Reset password');
      console.log('  GET  /api/auth/confirm-email - Confirm email');
      console.log('  POST /api/auth/resend-confirmation - Resend confirmation');
      console.log('  POST /api/game/create - Create game');
      console.log('  POST /api/game/:id/start - Start game');
      console.log('  POST /api/game/:id/play - Play card');
      console.log('  GET  /api/game/:id - Get game state');
      console.log('  GET  /api/game/my-games - Get my games');
      console.log('========================================');
      console.log('WebSocket Events (namespace: /game):');
      console.log('  join-game, leave-game, play-card, start-game');
      console.log('  get-game-state, send-challenge, respond-challenge');
      console.log('========================================');
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown(signal: string) {
  console.log(`\n${signal} signal received: closing HTTP server`);

  server.close(async () => {
    console.log('HTTP server closed');

    try {
      await disconnectDatabase();
      console.log('Database disconnected');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Forcing shutdown after 30 seconds');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
startServer();

export { app, server, io };
