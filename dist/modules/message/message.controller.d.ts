import { Request, Response } from 'express';
export declare class MessageController {
    sendMessage: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getGameMessages: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteMessage: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getRecentMessages: (req: Request, res: Response, next: import("express").NextFunction) => void;
    clearGameMessages: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
declare const _default: MessageController;
export default _default;
//# sourceMappingURL=message.controller.d.ts.map