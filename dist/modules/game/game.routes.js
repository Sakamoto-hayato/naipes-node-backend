"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const game_controller_1 = __importDefault(require("./game.controller"));
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post('/create', game_controller_1.default.create);
router.post('/:id/start', game_controller_1.default.start);
router.post('/:id/play', game_controller_1.default.playCard);
router.get('/:id', game_controller_1.default.getGame);
router.get('/my-games', game_controller_1.default.getMyGames);
router.post('/:id/challenge', game_controller_1.default.makeChallenge);
router.post('/:id/challenge/:challengeId/respond', game_controller_1.default.respondToChallenge);
router.post('/:id/calculate-envido', game_controller_1.default.calculateEnvido);
exports.default = router;
//# sourceMappingURL=game.routes.js.map