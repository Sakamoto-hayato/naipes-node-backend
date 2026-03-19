import { ChallengeType } from './constants/challenge-values';
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
        hostUser: {
            id: string;
            username: string;
            profilePicture: string | null;
            points: number;
        };
        guestUser: {
            id: string;
            email: string;
            username: string;
            confirmationToken: string | null;
            password: string;
            firstName: string | null;
            lastName: string | null;
            gender: string | null;
            age: number | null;
            profilePicture: string | null;
            enabled: boolean;
            tokenExpiry: Date | null;
            coins: number;
            gamesPlayed: number;
            gamesWon: number;
            gamesAbandoned: number;
            points: number;
            position: number | null;
            tournamentsWon: number;
            alternateCards: boolean;
            alternateMode: boolean;
            chatEnabled: boolean;
            soundEnabled: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
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
    startGame(gameId: string, _userId: string): Promise<{
        hostUser: {
            id: string;
            username: string;
            profilePicture: string | null;
        };
        guestUser: {
            id: string;
            username: string;
            profilePicture: string | null;
        } | null;
        rounds: ({
            tricks: {
                id: string;
                createdAt: Date;
                finishedAt: Date | null;
                winnerId: string | null;
                trickNumber: number;
                roundId: string;
                handUserCard: string | null;
                otherUserCard: string | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            gameId: string;
            hostScore: number;
            guestScore: number;
            handUserId: string;
            finishedAt: Date | null;
            roundNumber: number;
            hostCards: import("@prisma/client/runtime/library").JsonValue;
            guestCards: import("@prisma/client/runtime/library").JsonValue;
            currentTrick: number;
            winnerId: string | null;
        })[];
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
    createRound(gameId: string, handUserId: string): Promise<{
        id: string;
        createdAt: Date;
        gameId: string;
        hostScore: number;
        guestScore: number;
        handUserId: string;
        finishedAt: Date | null;
        roundNumber: number;
        hostCards: import("@prisma/client/runtime/library").JsonValue;
        guestCards: import("@prisma/client/runtime/library").JsonValue;
        currentTrick: number;
        winnerId: string | null;
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
            tricks: ({
                challenges: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    type: string;
                    trickId: string;
                    accepted: boolean | null;
                }[];
            } & {
                id: string;
                createdAt: Date;
                finishedAt: Date | null;
                winnerId: string | null;
                trickNumber: number;
                roundId: string;
                handUserCard: string | null;
                otherUserCard: string | null;
            })[];
        } & {
            id: string;
            createdAt: Date;
            gameId: string;
            hostScore: number;
            guestScore: number;
            handUserId: string;
            finishedAt: Date | null;
            roundNumber: number;
            hostCards: import("@prisma/client/runtime/library").JsonValue;
            guestCards: import("@prisma/client/runtime/library").JsonValue;
            currentTrick: number;
            winnerId: string | null;
        })[];
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
            tricks: ({
                challenges: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    type: string;
                    trickId: string;
                    accepted: boolean | null;
                }[];
            } & {
                id: string;
                createdAt: Date;
                finishedAt: Date | null;
                winnerId: string | null;
                trickNumber: number;
                roundId: string;
                handUserCard: string | null;
                otherUserCard: string | null;
            })[];
        } & {
            id: string;
            createdAt: Date;
            gameId: string;
            hostScore: number;
            guestScore: number;
            handUserId: string;
            finishedAt: Date | null;
            roundNumber: number;
            hostCards: import("@prisma/client/runtime/library").JsonValue;
            guestCards: import("@prisma/client/runtime/library").JsonValue;
            currentTrick: number;
            winnerId: string | null;
        })[];
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
            tricks: ({
                challenges: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    type: string;
                    trickId: string;
                    accepted: boolean | null;
                }[];
            } & {
                id: string;
                createdAt: Date;
                finishedAt: Date | null;
                winnerId: string | null;
                trickNumber: number;
                roundId: string;
                handUserCard: string | null;
                otherUserCard: string | null;
            })[];
        } & {
            id: string;
            createdAt: Date;
            gameId: string;
            hostScore: number;
            guestScore: number;
            handUserId: string;
            finishedAt: Date | null;
            roundNumber: number;
            hostCards: import("@prisma/client/runtime/library").JsonValue;
            guestCards: import("@prisma/client/runtime/library").JsonValue;
            currentTrick: number;
            winnerId: string | null;
        })[];
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
    getUserGames(userId: string, status?: string): Promise<({
        hostUser: {
            id: string;
            username: string;
            profilePicture: string | null;
        };
        guestUser: {
            id: string;
            username: string;
            profilePicture: string | null;
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
    makeChallenge(data: {
        gameId: string;
        userId: string;
        type: ChallengeType;
    }): Promise<any>;
    respondToChallenge(data: {
        gameId: string;
        userId: string;
        challengeId: string;
        accepted: boolean;
        raiseType?: ChallengeType;
    }): Promise<any>;
    private processRejectedChallenge;
    calculateEnvidoWinner(gameId: string): Promise<any>;
}
declare const _default: GameService;
export default _default;
//# sourceMappingURL=game.service.d.ts.map