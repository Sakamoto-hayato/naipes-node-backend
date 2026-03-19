"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const coin_controller_1 = __importDefault(require("./coin.controller"));
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/packages', auth_middleware_1.authenticate, coin_controller_1.default.getPackages);
router.get('/packages/:id', auth_middleware_1.authenticate, coin_controller_1.default.getPackageById);
router.post('/purchase', auth_middleware_1.authenticate, coin_controller_1.default.purchasePackage);
router.get('/transactions', auth_middleware_1.authenticate, coin_controller_1.default.getTransactions);
router.get('/transactions/:id', auth_middleware_1.authenticate, coin_controller_1.default.getTransactionById);
router.get('/admin/packages', auth_middleware_1.authenticate, coin_controller_1.default.getAllPackages);
router.post('/admin/packages', auth_middleware_1.authenticate, coin_controller_1.default.createPackage);
router.put('/admin/packages/:id', auth_middleware_1.authenticate, coin_controller_1.default.updatePackage);
router.delete('/admin/packages/:id', auth_middleware_1.authenticate, coin_controller_1.default.deletePackage);
router.get('/admin/transactions', auth_middleware_1.authenticate, coin_controller_1.default.getAllTransactions);
router.get('/admin/stats', auth_middleware_1.authenticate, coin_controller_1.default.getStats);
exports.default = router;
//# sourceMappingURL=coin.routes.js.map