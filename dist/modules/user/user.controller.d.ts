import { Request, Response } from 'express';
export declare class UserController {
    getProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getByUsername: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateSettings: (req: Request, res: Response, next: import("express").NextFunction) => void;
    changePassword: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getGameHistory: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteAccount: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
declare const _default: UserController;
export default _default;
//# sourceMappingURL=user.controller.d.ts.map