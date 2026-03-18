"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisHelper = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const redis = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB) || 0,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
            return true;
        }
        return false;
    },
});
redis.on('connect', () => {
    console.log('✓ Redis connected');
});
redis.on('error', (err) => {
    console.error('✗ Redis connection error:', err);
});
redis.on('ready', () => {
    console.log('✓ Redis ready');
});
exports.redisHelper = {
    async setGameState(gameId, state, ttl = 3600) {
        await redis.setex(`game:${gameId}`, ttl, JSON.stringify(state));
    },
    async getGameState(gameId) {
        const data = await redis.get(`game:${gameId}`);
        return data ? JSON.parse(data) : null;
    },
    async deleteGameState(gameId) {
        await redis.del(`game:${gameId}`);
    },
    async setUserSession(userId, sessionData, ttl = 86400) {
        await redis.setex(`session:${userId}`, ttl, JSON.stringify(sessionData));
    },
    async getUserSession(userId) {
        const data = await redis.get(`session:${userId}`);
        return data ? JSON.parse(data) : null;
    },
    async setCache(key, value, ttl = 300) {
        await redis.setex(key, ttl, JSON.stringify(value));
    },
    async getCache(key) {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    },
    async deleteCache(key) {
        await redis.del(key);
    },
};
exports.default = redis;
//# sourceMappingURL=redis.js.map