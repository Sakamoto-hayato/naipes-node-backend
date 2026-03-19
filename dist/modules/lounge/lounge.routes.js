"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lounge_controller_1 = __importDefault(require("./lounge.controller"));
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post('/create', lounge_controller_1.default.create);
router.get('/available', lounge_controller_1.default.getAvailable);
router.post('/:id/join', lounge_controller_1.default.join);
router.delete('/:id/cancel', lounge_controller_1.default.cancel);
router.post('/:id/leave', lounge_controller_1.default.leave);
router.get('/play-key/:playKey', lounge_controller_1.default.getByPlayKey);
router.post('/quick-match', lounge_controller_1.default.quickMatch);
router.get('/my-games', lounge_controller_1.default.getMyGames);
exports.default = router;
//# sourceMappingURL=lounge.routes.js.map