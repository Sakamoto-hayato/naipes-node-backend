export interface CreateGameDto {
    hostUserId: string;
    guestUserId?: string;
    bet: number;
    level: number;
    isBot?: boolean;
}
export interface PlayCardDto {
    gameId: string;
    userId: string;
    card: string;
}
export interface ChallengeDto {
    gameId: string;
    userId: string;
    type: 'truco' | 'retruco' | 'vale4' | 'envido' | 'realenvido' | 'faltaenvido';
}
export declare class GameService {
    createGame(data: CreateGameDto): Promise<{
        id: string;
        alternateMode: boolean;
        hostUserId: string;
        guestUserId: string | null;
        hostScore: number;
        guestScore: number;
        stake: number;
        currentRound: number;
        turnUserId: string | null;
        handUserId: string | null;
        isTournament: boolean;
        playKey: string | null;
        winnerId: string | null;
        startedAt: Date;
        finishedAt: Date | null;
        abandonedAt: Date | null;
    }>;
    startGame(gameId: string, userId: string): Promise<{
        id: string;
        alternateMode: boolean;
        hostUserId: string;
        guestUserId: string | null;
        hostScore: number;
        guestScore: number;
        stake: number;
        currentRound: number;
        turnUserId: string | null;
        handUserId: string | null;
        isTournament: boolean;
        playKey: string | null;
        winnerId: string | null;
        startedAt: Date;
        finishedAt: Date | null;
        abandonedAt: Date | null;
    }>;
    createRound(gameId: string, handUserId: string): Promise<{
        id: string;
        createdAt: Date;
        hostCards: import("@prisma/client/runtime/library").JsonValue;
        guestCards: import("@prisma/client/runtime/library").JsonValue;
        hostScore: number;
        guestScore: number;
        handUserId: string;
        winnerId: string | null;
        finishedAt: Date | null;
        gameId: string;
        roundNumber: number;
        currentTrick: number;
    } | null>;
    playCard(data: PlayCardDto): Promise<{
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
        rounds: ({
            tricks: {
                id: string;
                createdAt: Date;
                winnerId: string | null;
                finishedAt: Date | null;
                trickNumber: number;
                roundId: string;
                handUserCard: string | null;
                otherUserCard: string | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            hostCards: import("@prisma/client/runtime/library").JsonValue;
            guestCards: import("@prisma/client/runtime/library").JsonValue;
            hostScore: number;
            guestScore: number;
            handUserId: string;
            winnerId: string | null;
            finishedAt: Date | null;
            gameId: string;
            roundNumber: number;
            currentTrick: number;
        })[];
    } & {
        id: string;
        alternateMode: boolean;
        hostUserId: string;
        guestUserId: string | null;
        hostScore: number;
        guestScore: number;
        stake: number;
        currentRound: number;
        turnUserId: string | null;
        handUserId: string | null;
        isTournament: boolean;
        playKey: string | null;
        winnerId: string | null;
        startedAt: Date;
        finishedAt: Date | null;
        abandonedAt: Date | null;
    }>;
    completeTrick(trickId: string): Promise<void>;
    completeRound(roundId: string): Promise<void>;
    completeGame(gameId: string): Promise<({
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
        rounds: ({
            tricks: {
                id: string;
                createdAt: Date;
                winnerId: string | null;
                finishedAt: Date | null;
                trickNumber: number;
                roundId: string;
                handUserCard: string | null;
                otherUserCard: string | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            hostCards: import("@prisma/client/runtime/library").JsonValue;
            guestCards: import("@prisma/client/runtime/library").JsonValue;
            hostScore: number;
            guestScore: number;
            handUserId: string;
            winnerId: string | null;
            finishedAt: Date | null;
            gameId: string;
            roundNumber: number;
            currentTrick: number;
        })[];
    } & {
        id: string;
        alternateMode: boolean;
        hostUserId: string;
        guestUserId: string | null;
        hostScore: number;
        guestScore: number;
        stake: number;
        currentRound: number;
        turnUserId: string | null;
        handUserId: string | null;
        isTournament: boolean;
        playKey: string | null;
        winnerId: string | null;
        startedAt: Date;
        finishedAt: Date | null;
        abandonedAt: Date | null;
    }) | undefined>;
    getGameState(gameId: string): Promise<{
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
        rounds: ({
            tricks: {
                id: string;
                createdAt: Date;
                winnerId: string | null;
                finishedAt: Date | null;
                trickNumber: number;
                roundId: string;
                handUserCard: string | null;
                otherUserCard: string | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            hostCards: import("@prisma/client/runtime/library").JsonValue;
            guestCards: import("@prisma/client/runtime/library").JsonValue;
            hostScore: number;
            guestScore: number;
            handUserId: string;
            winnerId: string | null;
            finishedAt: Date | null;
            gameId: string;
            roundNumber: number;
            currentTrick: number;
        })[];
    } & {
        id: string;
        alternateMode: boolean;
        hostUserId: string;
        guestUserId: string | null;
        hostScore: number;
        guestScore: number;
        stake: number;
        currentRound: number;
        turnUserId: string | null;
        handUserId: string | null;
        isTournament: boolean;
        playKey: string | null;
        winnerId: string | null;
        startedAt: Date;
        finishedAt: Date | null;
        abandonedAt: Date | null;
    }>;
    getUserGames(userId: string, status?: string): Promise<{
        id: string;
        alternateMode: boolean;
        hostUserId: string;
        guestUserId: string | null;
        hostScore: number;
        guestScore: number;
        stake: number;
        currentRound: number;
        turnUserId: string | null;
        handUserId: string | null;
        isTournament: boolean;
        playKey: string | null;
        winnerId: string | null;
        startedAt: Date;
        finishedAt: Date | null;
        abandonedAt: Date | null;
    }[]>;
}
declare const _default: GameService;
export default _default;
//# sourceMappingURL=game.service.d.ts.map