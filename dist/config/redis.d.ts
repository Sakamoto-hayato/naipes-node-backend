import Redis from 'ioredis';
declare const redis: Redis;
export declare const redisHelper: {
    setGameState(gameId: string, state: any, ttl?: number): Promise<void>;
    getGameState(gameId: string): Promise<any | null>;
    deleteGameState(gameId: string): Promise<void>;
    setUserSession(userId: string, sessionData: any, ttl?: number): Promise<void>;
    getUserSession(userId: string): Promise<any | null>;
    setCache(key: string, value: any, ttl?: number): Promise<void>;
    getCache(key: string): Promise<any | null>;
    deleteCache(key: string): Promise<void>;
};
export default redis;
//# sourceMappingURL=redis.d.ts.map