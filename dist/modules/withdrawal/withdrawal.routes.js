"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const withdrawal_controller_1 = __importDefault(require("./withdrawal.controller"));
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post('/', withdrawal_controller_1.default.createRequest);
router.get('/my-requests', withdrawal_controller_1.default.getMyRequests);
router.get('/:id', withdrawal_controller_1.default.getRequestById);
router.post('/:id/cancel', withdrawal_controller_1.default.cancelRequest);
router.get('/admin/all', withdrawal_controller_1.default.getAllRequests);
router.put('/admin/:id', withdrawal_controller_1.default.updateRequest);
router.get('/admin/stats', withdrawal_controller_1.default.getStats);
exports.default = router;
//# sourceMappingURL=withdrawal.routes.js.map