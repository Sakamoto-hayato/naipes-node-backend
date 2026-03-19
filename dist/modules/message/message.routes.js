"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const message_controller_1 = __importDefault(require("./message.controller"));
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post('/', message_controller_1.default.sendMessage);
router.get('/game/:gameId', message_controller_1.default.getGameMessages);
router.delete('/:id', message_controller_1.default.deleteMessage);
router.get('/recent', message_controller_1.default.getRecentMessages);
router.delete('/game/:gameId/clear', message_controller_1.default.clearGameMessages);
exports.default = router;
//# sourceMappingURL=message.routes.js.map