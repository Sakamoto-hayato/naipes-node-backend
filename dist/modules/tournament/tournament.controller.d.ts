import { Request, Response } from 'express';
export declare class TournamentController {
    getAllTournaments: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getTournamentById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getActiveTournaments: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getUpcomingTournaments: (req: Request, res: Response, next: import("express").NextFunction) => void;
    joinTournament: (req: Request, res: Response, next: import("express").NextFunction) => void;
    leaveTournament: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getMyTournaments: (req: Request, res: Response, next: import("express").NextFunction) => void;
    createTournament: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateTournament: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteTournament: (req: Request, res: Response, next: import("express").NextFunction) => void;
    startTournament: (req: Request, res: Response, next: import("express").NextFunction) => void;
    endTournament: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
declare const _default: TournamentController;
export default _default;
//# sourceMappingURL=tournament.controller.d.ts.map