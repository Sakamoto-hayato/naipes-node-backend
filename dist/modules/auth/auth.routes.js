"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = __importDefault(require("./auth.controller"));
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post('/register', auth_controller_1.default.register);
router.post('/login', auth_controller_1.default.login);
router.post('/refresh', auth_controller_1.default.refreshToken);
router.post('/recover', auth_controller_1.default.requestPasswordRecovery);
router.post('/reset-password', auth_controller_1.default.resetPassword);
router.get('/confirm-email', auth_controller_1.default.confirmEmail);
router.post('/resend-confirmation', auth_controller_1.default.resendConfirmation);
router.get('/me', auth_middleware_1.authenticate, auth_controller_1.default.getMe);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map