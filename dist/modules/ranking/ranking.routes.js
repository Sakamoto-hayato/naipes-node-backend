"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ranking_controller_1 = __importDefault(require("./ranking.controller"));
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/leaderboard', auth_middleware_1.authenticate, ranking_controller_1.default.getLeaderboard);
router.get('/my-rank', auth_middleware_1.authenticate, ranking_controller_1.default.getMyRank);
router.get('/user/:userId', auth_middleware_1.authenticate, ranking_controller_1.default.getUserRank);
router.get('/top', auth_middleware_1.authenticate, ranking_controller_1.default.getTopPlayers);
router.get('/near/:rank', auth_middleware_1.authenticate, ranking_controller_1.default.getNearRank);
router.get('/weekly', auth_middleware_1.authenticate, ranking_controller_1.default.getWeeklyTopPlayers);
router.get('/tournament-winners', auth_middleware_1.authenticate, ranking_controller_1.default.getTournamentWinners);
router.post('/update', auth_middleware_1.authenticate, ranking_controller_1.default.updateRankings);
exports.default = router;
//# sourceMappingURL=ranking.routes.js.map