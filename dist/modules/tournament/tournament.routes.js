"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tournament_controller_1 = __importDefault(require("./tournament.controller"));
const auth_middleware_1 = require("../../shared/middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticate, tournament_controller_1.default.getAllTournaments);
router.get('/active/list', auth_middleware_1.authenticate, tournament_controller_1.default.getActiveTournaments);
router.get('/upcoming/list', auth_middleware_1.authenticate, tournament_controller_1.default.getUpcomingTournaments);
router.get('/my/list', auth_middleware_1.authenticate, tournament_controller_1.default.getMyTournaments);
router.get('/:id', auth_middleware_1.authenticate, tournament_controller_1.default.getTournamentById);
router.post('/:id/join', auth_middleware_1.authenticate, tournament_controller_1.default.joinTournament);
router.post('/:id/leave', auth_middleware_1.authenticate, tournament_controller_1.default.leaveTournament);
router.post('/', auth_middleware_1.authenticate, tournament_controller_1.default.createTournament);
router.put('/:id', auth_middleware_1.authenticate, tournament_controller_1.default.updateTournament);
router.delete('/:id', auth_middleware_1.authenticate, tournament_controller_1.default.deleteTournament);
router.post('/:id/start', auth_middleware_1.authenticate, tournament_controller_1.default.startTournament);
router.post('/:id/end', auth_middleware_1.authenticate, tournament_controller_1.default.endTournament);
exports.default = router;
//# sourceMappingURL=tournament.routes.js.map