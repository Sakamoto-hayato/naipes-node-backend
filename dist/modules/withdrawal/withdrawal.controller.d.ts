import { Request, Response } from 'express';
export declare class WithdrawalController {
    createRequest: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getMyRequests: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getRequestById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    cancelRequest: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getAllRequests: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateRequest: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
declare const _default: WithdrawalController;
export default _default;
//# sourceMappingURL=withdrawal.controller.d.ts.map