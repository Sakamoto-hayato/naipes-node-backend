export interface CreateTournamentDto {
    name: string;
    description?: string;
    entryFee: number;
    prizePool: number;
    maxParticipants: number;
    startDate: Date;
    endDate: Date;
    rules?: string;
}
export interface UpdateTournamentDto {
    name?: string;
    description?: string;
    entryFee?: number;
    prizePool?: number;
    maxParticipants?: number;
    startDate?: Date;
    endDate?: Date;
    status?: string;
    rules?: string;
}
declare class TournamentService {
    getAllTournaments(status?: string, limit?: number, offset?: number): Promise<{
        participantCount: any;
        _count: undefined;
        id: string;
        createdAt: Date;
        userId: string;
        stake: number;
        currentRound: number;
        finishedAt: Date | null;
        maxPlayers: number;
        round1OpponentId: string | null;
        round2OpponentId: string | null;
        round3OpponentId: string | null;
        round4OpponentId: string | null;
        round5OpponentId: string | null;
        isWinnerRound1: boolean;
        isWinnerRound2: boolean;
        isWinnerRound3: boolean;
        isWinnerRound4: boolean;
        isWinnerRound5: boolean;
        isWinner: boolean;
        isSecondPlace: boolean;
    }[]>;
    getTournamentById(tournamentId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        stake: number;
        currentRound: number;
        finishedAt: Date | null;
        maxPlayers: number;
        round1OpponentId: string | null;
        round2OpponentId: string | null;
        round3OpponentId: string | null;
        round4OpponentId: string | null;
        round5OpponentId: string | null;
        isWinnerRound1: boolean;
        isWinnerRound2: boolean;
        isWinnerRound3: boolean;
        isWinnerRound4: boolean;
        isWinnerRound5: boolean;
        isWinner: boolean;
        isSecondPlace: boolean;
    }>;
    createTournament(data: CreateTournamentDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        stake: number;
        currentRound: number;
        finishedAt: Date | null;
        maxPlayers: number;
        round1OpponentId: string | null;
        round2OpponentId: string | null;
        round3OpponentId: string | null;
        round4OpponentId: string | null;
        round5OpponentId: string | null;
        isWinnerRound1: boolean;
        isWinnerRound2: boolean;
        isWinnerRound3: boolean;
        isWinnerRound4: boolean;
        isWinnerRound5: boolean;
        isWinner: boolean;
        isSecondPlace: boolean;
    }>;
    updateTournament(tournamentId: string, data: UpdateTournamentDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        stake: number;
        currentRound: number;
        finishedAt: Date | null;
        maxPlayers: number;
        round1OpponentId: string | null;
        round2OpponentId: string | null;
        round3OpponentId: string | null;
        round4OpponentId: string | null;
        round5OpponentId: string | null;
        isWinnerRound1: boolean;
        isWinnerRound2: boolean;
        isWinnerRound3: boolean;
        isWinnerRound4: boolean;
        isWinnerRound5: boolean;
        isWinner: boolean;
        isSecondPlace: boolean;
    }>;
    deleteTournament(tournamentId: string): Promise<{
        message: string;
    }>;
    joinTournament(tournamentId: string, userId: string): Promise<{
        message: string;
    }>;
    leaveTournament(tournamentId: string, userId: string): Promise<{
        message: string;
    }>;
    getUserTournaments(userId: string): Promise<any>;
    getActiveTournaments(): Promise<{
        participantCount: any;
        _count: undefined;
        id: string;
        createdAt: Date;
        userId: string;
        stake: number;
        currentRound: number;
        finishedAt: Date | null;
        maxPlayers: number;
        round1OpponentId: string | null;
        round2OpponentId: string | null;
        round3OpponentId: string | null;
        round4OpponentId: string | null;
        round5OpponentId: string | null;
        isWinnerRound1: boolean;
        isWinnerRound2: boolean;
        isWinnerRound3: boolean;
        isWinnerRound4: boolean;
        isWinnerRound5: boolean;
        isWinner: boolean;
        isSecondPlace: boolean;
    }[]>;
    getUpcomingTournaments(): Promise<{
        participantCount: any;
        _count: undefined;
        id: string;
        createdAt: Date;
        userId: string;
        stake: number;
        currentRound: number;
        finishedAt: Date | null;
        maxPlayers: number;
        round1OpponentId: string | null;
        round2OpponentId: string | null;
        round3OpponentId: string | null;
        round4OpponentId: string | null;
        round5OpponentId: string | null;
        isWinnerRound1: boolean;
        isWinnerRound2: boolean;
        isWinnerRound3: boolean;
        isWinnerRound4: boolean;
        isWinnerRound5: boolean;
        isWinner: boolean;
        isSecondPlace: boolean;
    }[]>;
    startTournament(tournamentId: string): Promise<{
        message: string;
    }>;
    endTournament(tournamentId: string, winnerId?: string): Promise<{
        message: string;
    }>;
}
declare const _default: TournamentService;
export default _default;
//# sourceMappingURL=tournament.service.d.ts.map