import express, { Application } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// 설정
import { connectDatabase, disconnectDatabase } from './config/database';
import logger from './config/logger';

// 미들웨어
import { errorHandler, notFoundHandler } from './shared/middleware/error.middleware';

// 라우트
import authRoutes from './modules/auth/auth.routes';

// 환경 변수 로드
dotenv.config();

const app: Application = express();
const server = http.createServer(app);

// Socket.IO 설정
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: Number(process.env.WS_PING_TIMEOUT) || 5000,
  pingInterval: Number(process.env.WS_PING_INTERVAL) || 25000
});

// 기본 미들웨어
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 요청 로깅 (개발 환경)
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

// API 라우트
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

// 모듈 라우트 등록
app.use('/api/auth', authRoutes);

// WebSocket 연결 처리
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });

  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });

  // 인증 이벤트
  socket.on('authenticate', (data) => {
    logger.info('Socket authentication request', { socketId: socket.id });
    // TODO: JWT 토큰 검증 로직 추가
    socket.emit('authenticated', { success: true });
  });
});

// 404 핸들러
app.use(notFoundHandler);

// 에러 핸들러 (마지막에 등록)
app.use(errorHandler);

// 서버 시작
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  try {
    // 데이터베이스 연결
    await connectDatabase();
    logger.info('Database connected successfully');

    // 서버 시작
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

  // 강제 종료 (30초 후)
  setTimeout(() => {
    console.error('Forcing shutdown after 30 seconds');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// 서버 시작
startServer();

export { app, server, io };
