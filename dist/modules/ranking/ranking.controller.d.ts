import { Request, Response } from 'express';
export declare class RankingController {
    getLeaderboard: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getMyRank: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getUserRank: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getTopPlayers: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getNearRank: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getWeeklyTopPlayers: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getTournamentWinners: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateRankings: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
declare const _default: RankingController;
export default _default;
//# sourceMappingURL=ranking.controller.d.ts.map