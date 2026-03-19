declare class RankingService {
    getGlobalLeaderboard(limit?: number, offset?: number): Promise<{
        rank: number;
        winRate: number;
        id: string;
        username: string;
        profilePicture: string | null;
        gamesPlayed: number;
        gamesWon: number;
        points: number;
        position: number | null;
        tournamentsWon: number;
    }[]>;
    getUserRank(userId: string): Promise<{
        rank: number;
        winRate: number;
        id: string;
        username: string;
        profilePicture: string | null;
        gamesPlayed: number;
        gamesWon: number;
        points: number;
        position: number | null;
        tournamentsWon: number;
    }>;
    getTopPlayers(limit?: number): Promise<{
        rank: number;
        winRate: number;
        id: string;
        username: string;
        profilePicture: string | null;
        gamesPlayed: number;
        gamesWon: number;
        points: number;
        position: number | null;
        tournamentsWon: number;
    }[]>;
    getLeaderboardNearRank(rank: number, range?: number): Promise<{
        rank: number;
        winRate: number;
        id: string;
        username: string;
        profilePicture: string | null;
        gamesPlayed: number;
        gamesWon: number;
        points: number;
        position: number | null;
        tournamentsWon: number;
    }[]>;
    updateUserRankings(): Promise<{
        message: string;
        totalUsers: number;
    }>;
    getWeeklyTopPlayers(limit?: number): Promise<{
        rank: number;
        weeklyPoints: number;
        id: string;
        username: string;
        profilePicture: string | null;
        points: number;
        position: number | null;
    }[]>;
    getTournamentWinners(limit?: number): Promise<{
        rank: number;
        id: string;
        username: string;
        profilePicture: string | null;
        gamesPlayed: number;
        gamesWon: number;
        points: number;
        position: number | null;
        tournamentsWon: number;
    }[]>;
}
declare const _default: RankingService;
export default _default;
//# sourceMappingURL=ranking.service.d.ts.map