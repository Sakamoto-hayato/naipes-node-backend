import { Request, Response } from 'express';
export declare class CoinController {
    getPackages: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getPackageById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    purchasePackage: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getTransactions: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getTransactionById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getAllPackages: (req: Request, res: Response, next: import("express").NextFunction) => void;
    createPackage: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updatePackage: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deletePackage: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getAllTransactions: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
declare const _default: CoinController;
export default _default;
//# sourceMappingURL=coin.controller.d.ts.map