import Redis from 'ioredis';

// Create Redis client
const redis = new Redis({
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

// Redis connection events
redis.on('connect', () => {
  console.log('✓ Redis connected');
});

redis.on('error', (err) => {
  console.error('✗ Redis connection error:', err);
});

redis.on('ready', () => {
  console.log('✓ Redis ready');
});

// Redis helper functions
export const redisHelper = {
  // Save game state
  async setGameState(gameId: string, state: any, ttl: number = 3600): Promise<void> {
    await redis.setex(`game:${gameId}`, ttl, JSON.stringify(state));
  },

  // Get game state
  async getGameState(gameId: string): Promise<any | null> {
    const data = await redis.get(`game:${gameId}`);
    return data ? JSON.parse(data) : null;
  },

  // Delete game state
  async deleteGameState(gameId: string): Promise<void> {
    await redis.del(`game:${gameId}`);
  },

  // Save user session
  async setUserSession(userId: string, sessionData: any, ttl: number = 86400): Promise<void> {
    await redis.setex(`session:${userId}`, ttl, JSON.stringify(sessionData));
  },

  // Get user session
  async getUserSession(userId: string): Promise<any | null> {
    const data = await redis.get(`session:${userId}`);
    return data ? JSON.parse(data) : null;
  },

  // Save cache
  async setCache(key: string, value: any, ttl: number = 300): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value));
  },

  // Get cache
  async getCache(key: string): Promise<any | null> {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  // Delete cache
  async deleteCache(key: string): Promise<void> {
    await redis.del(key);
  },
};

export default redis;
