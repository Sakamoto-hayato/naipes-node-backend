"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const logger_1 = __importDefault(require("./config/logger"));
const email_1 = require("./config/email");
const error_middleware_1 = require("./shared/middleware/error.middleware");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const game_routes_1 = __importDefault(require("./modules/game/game.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const server = http_1.default.createServer(app);
exports.server = server;
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || '*',
        methods: ['GET', 'POST'],
        credentials: true
    },
    pingTimeout: Number(process.env.WS_PING_TIMEOUT) || 5000,
    pingInterval: Number(process.env.WS_PING_INTERVAL) || 25000
});
exports.io = io;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV === 'development') {
    app.use((req, _res, next) => {
        logger_1.default.info(`${req.method} ${req.path}`);
        next();
    });
}
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
app.use('/api/auth', auth_routes_1.default);
app.use('/api/game', game_routes_1.default);
io.on('connection', (socket) => {
    logger_1.default.info(`Client connected: ${socket.id}`);
    socket.on('disconnect', () => {
        logger_1.default.info(`Client disconnected: ${socket.id}`);
    });
    socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
    });
    socket.on('authenticate', (_data) => {
        logger_1.default.info('Socket authentication request', { socketId: socket.id });
        socket.emit('authenticated', { success: true });
    });
});
app.use(error_middleware_1.notFoundHandler);
app.use(error_middleware_1.errorHandler);
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
async function startServer() {
    try {
        await (0, database_1.connectDatabase)();
        logger_1.default.info('Database connected successfully');
        await (0, email_1.verifyEmailConnection)();
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
            console.log('========================================');
        });
    }
    catch (error) {
        logger_1.default.error('Failed to start server', error);
        process.exit(1);
    }
}
async function shutdown(signal) {
    console.log(`\n${signal} signal received: closing HTTP server`);
    server.close(async () => {
        console.log('HTTP server closed');
        try {
            await (0, database_1.disconnectDatabase)();
            console.log('Database disconnected');
            process.exit(0);
        }
        catch (error) {
            console.error('Error during shutdown:', error);
            process.exit(1);
        }
    });
    setTimeout(() => {
        console.error('Forcing shutdown after 30 seconds');
        process.exit(1);
    }, 30000);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
startServer();
//# sourceMappingURL=server.js.map