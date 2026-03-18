import Redis from 'ioredis';

// Redis 클라이언트 생성
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

// Redis 연결 이벤트
redis.on('connect', () => {
  console.log('✓ Redis connected');
});

redis.on('error', (err) => {
  console.error('✗ Redis connection error:', err);
});

redis.on('ready', () => {
  console.log('✓ Redis ready');
});

// Redis 헬퍼 함수들
export const redisHelper = {
  // 게임 상태 저장
  async setGameState(gameId: string, state: any, ttl: number = 3600): Promise<void> {
    await redis.setex(`game:${gameId}`, ttl, JSON.stringify(state));
  },

  // 게임 상태 조회
  async getGameState(gameId: string): Promise<any | null> {
    const data = await redis.get(`game:${gameId}`);
    return data ? JSON.parse(data) : null;
  },

  // 게임 상태 삭제
  async deleteGameState(gameId: string): Promise<void> {
    await redis.del(`game:${gameId}`);
  },

  // 사용자 세션 저장
  async setUserSession(userId: string, sessionData: any, ttl: number = 86400): Promise<void> {
    await redis.setex(`session:${userId}`, ttl, JSON.stringify(sessionData));
  },

  // 사용자 세션 조회
  async getUserSession(userId: string): Promise<any | null> {
    const data = await redis.get(`session:${userId}`);
    return data ? JSON.parse(data) : null;
  },

  // 캐시 저장
  async setCache(key: string, value: any, ttl: number = 300): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value));
  },

  // 캐시 조회
  async getCache(key: string): Promise<any | null> {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  // 캐시 삭제
  async deleteCache(key: string): Promise<void> {
    await redis.del(key);
  },
};

export default redis;
