export interface CreateLoungeGameDto {
    hostUserId: string;
    bet: number;
    level: number;
    playKey?: string;
}
export interface JoinLoungeGameDto {
    gameId: string;
    userId: string;
    playKey?: string;
}
declare class LoungeService {
    createLoungeGame(data: CreateLoungeGameDto): Promise<{
        hostUser: {
            id: string;
            username: string;
            profilePicture: string | null;
            points: number;
        };
    } & {
        level: number;
        id: string;
        alternateMode: boolean;
        createdAt: Date;
        hostUserId: string;
        guestUserId: string | null;
        isBot: boolean;
        hostScore: number;
        guestScore: number;
        stake: number;
        currentRound: number;
        status: string;
        turnUserId: string | null;
        handUserId: string | null;
        userWonId: string | null;
        isTournament: boolean;
        playKey: string | null;
        startedAt: Date | null;
        finishedAt: Date | null;
        abandonedAt: Date | null;
    }>;
    getAvailableGames(filters?: {
        minBet?: number;
        maxBet?: number;
        level?: number;
    }): Promise<({
        hostUser: {
            id: string;
            username: string;
            profilePicture: string | null;
            points: number;
        };
    } & {
        level: number;
        id: string;
        alternateMode: boolean;
        createdAt: Date;
        hostUserId: string;
        guestUserId: string | null;
        isBot: boolean;
        hostScore: number;
        guestScore: number;
        stake: number;
        currentRound: number;
        status: string;
        turnUserId: string | null;
        handUserId: string | null;
        userWonId: string | null;
        isTournament: boolean;
        playKey: string | null;
        startedAt: Date | null;
        finishedAt: Date | null;
        abandonedAt: Date | null;
    })[]>;
    joinLoungeGame(data: JoinLoungeGameDto): Promise<{
        hostUser: {
            id: string;
            username: string;
            profilePicture: string | null;
            points: number;
        };
        guestUser: {
            id: string;
            username: string;
            profilePicture: string | null;
            points: number;
        } | null;
    } & {
        level: number;
        id: string;
        alternateMode: boolean;
        createdAt: Date;
        hostUserId: string;
        guestUserId: string | null;
        isBot: boolean;
        hostScore: number;
        guestScore: number;
        stake: number;
        currentRound: number;
        status: string;
        turnUserId: string | null;
        handUserId: string | null;
        userWonId: string | null;
        isTournament: boolean;
        playKey: string | null;
        startedAt: Date | null;
        finishedAt: Date | null;
        abandonedAt: Date | null;
    }>;
    cancelLoungeGame(gameId: string, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    leaveLoungeGame(gameId: string, userId: string): Promise<{
        success: boolean;
        message: string;
    } | ({
        hostUser: {
            id: string;
            username: string;
            profilePicture: string | null;
            points: number;
        };
    } & {
        level: number;
        id: string;
        alternateMode: boolean;
        createdAt: Date;
        hostUserId: string;
        guestUserId: string | null;
        isBot: boolean;
        hostScore: number;
        guestScore: number;
        stake: number;
        currentRound: number;
        status: string;
        turnUserId: string | null;
        handUserId: string | null;
        userWonId: string | null;
        isTournament: boolean;
        playKey: string | null;
        startedAt: Date | null;
        finishedAt: Date | null;
        abandonedAt: Date | null;
    })>;
    getGameByPlayKey(playKey: string): Promise<{
        hostUser: {
            id: string;
            username: string;
            profilePicture: string | null;
            points: number;
        };
    } & {
        level: number;
        id: string;
        alternateMode: boolean;
        createdAt: Date;
        hostUserId: string;
        guestUserId: string | null;
        isBot: boolean;
        hostScore: number;
        guestScore: number;
        stake: number;
        currentRound: number;
        status: string;
        turnUserId: string | null;
        handUserId: string | null;
        userWonId: string | null;
        isTournament: boolean;
        playKey: string | null;
        startedAt: Date | null;
        finishedAt: Date | null;
        abandonedAt: Date | null;
    }>;
    quickMatch(userId: string, bet: number, level: number): Promise<{
        hostUser: {
            id: string;
            username: string;
            profilePicture: string | null;
            points: number;
        };
    } & {
        level: number;
        id: string;
        alternateMode: boolean;
        createdAt: Date;
        hostUserId: string;
        guestUserId: string | null;
        isBot: boolean;
        hostScore: number;
        guestScore: number;
        stake: number;
        currentRound: number;
        status: string;
        turnUserId: string | null;
        handUserId: string | null;
        userWonId: string | null;
        isTournament: boolean;
        playKey: string | null;
        startedAt: Date | null;
        finishedAt: Date | null;
        abandonedAt: Date | null;
    }>;
    getUserLoungeGames(userId: string): Promise<({
        hostUser: {
            id: string;
            username: string;
            profilePicture: string | null;
            points: number;
        };
        guestUser: {
            id: string;
            username: string;
            profilePicture: string | null;
            points: number;
        } | null;
    } & {
        level: number;
        id: string;
        alternateMode: boolean;
        createdAt: Date;
        hostUserId: string;
        guestUserId: string | null;
        isBot: boolean;
        hostScore: number;
        guestScore: number;
        stake: number;
        currentRound: number;
        status: string;
        turnUserId: string | null;
        handUserId: string | null;
        userWonId: string | null;
        isTournament: boolean;
        playKey: string | null;
        startedAt: Date | null;
        finishedAt: Date | null;
        abandonedAt: Date | null;
    })[]>;
}
declare const _default: LoungeService;
export default _default;
//# sourceMappingURL=lounge.service.d.ts.map