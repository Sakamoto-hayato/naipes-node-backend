"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = __importDefault(require("./user.controller"));
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/profile', user_controller_1.default.getProfile);
router.put('/profile', user_controller_1.default.updateProfile);
router.get('/:username', user_controller_1.default.getByUsername);
router.put('/settings', user_controller_1.default.updateSettings);
router.post('/change-password', user_controller_1.default.changePassword);
router.get('/stats', user_controller_1.default.getStats);
router.get('/game-history', user_controller_1.default.getGameHistory);
router.delete('/account', user_controller_1.default.deleteAccount);
exports.default = router;
//# sourceMappingURL=user.routes.js.map