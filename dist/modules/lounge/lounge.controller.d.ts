import { Request, Response } from 'express';
export declare class LoungeController {
    create: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getAvailable: (req: Request, res: Response, next: import("express").NextFunction) => void;
    join: (req: Request, res: Response, next: import("express").NextFunction) => void;
    cancel: (req: Request, res: Response, next: import("express").NextFunction) => void;
    leave: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getByPlayKey: (req: Request, res: Response, next: import("express").NextFunction) => void;
    quickMatch: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getMyGames: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
declare const _default: LoungeController;
export default _default;
//# sourceMappingURL=lounge.controller.d.ts.map