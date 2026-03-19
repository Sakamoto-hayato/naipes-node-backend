"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentController = void 0;
const tournament_service_1 = __importDefault(require("./tournament.service"));
const response_1 = require("../../shared/utils/response");
const error_middleware_1 = require("../../shared/middleware/error.middleware");
class TournamentController {
    getAllTournaments = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { status, limit, offset } = req.query;
        const tournaments = await tournament_service_1.default.getAllTournaments(status, limit ? Number(limit) : 20, offset ? Number(offset) : 0);
        return (0, response_1.successResponse)(res, tournaments, 'Tournaments retrieved successfully');
    });
    getTournamentById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        if (!id) {
            throw new error_middleware_1.AppError('Tournament ID is required', 400, 'MISSING_FIELDS');
        }
        const tournament = await tournament_service_1.default.getTournamentById(id);
        return (0, response_1.successResponse)(res, tournament, 'Tournament retrieved successfully');
    });
    getActiveTournaments = (0, error_middleware_1.asyncHandler)(async (_req, res) => {
        const tournaments = await tournament_service_1.default.getActiveTournaments();
        return (0, response_1.successResponse)(res, tournaments, 'Active tournaments retrieved successfully');
    });
    getUpcomingTournaments = (0, error_middleware_1.asyncHandler)(async (_req, res) => {
        const tournaments = await tournament_service_1.default.getUpcomingTournaments();
        return (0, response_1.successResponse)(res, tournaments, 'Upcoming tournaments retrieved successfully');
    });
    joinTournament = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const { id } = req.params;
        if (!id) {
            throw new error_middleware_1.AppError('Tournament ID is required', 400, 'MISSING_FIELDS');
        }
        const result = await tournament_service_1.default.joinTournament(id, userId);
        return (0, response_1.successResponse)(res, result, 'Successfully joined tournament');
    });
    leaveTournament = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const { id } = req.params;
        if (!id) {
            throw new error_middleware_1.AppError('Tournament ID is required', 400, 'MISSING_FIELDS');
        }
        const result = await tournament_service_1.default.leaveTournament(id, userId);
        return (0, response_1.successResponse)(res, result, 'Successfully left tournament');
    });
    getMyTournaments = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_middleware_1.AppError('User not authenticated', 401, 'UNAUTHORIZED');
        }
        const tournaments = await tournament_service_1.default.getUserTournaments(userId);
        return (0, response_1.successResponse)(res, tournaments, 'User tournaments retrieved successfully');
    });
    createTournament = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { name, description, entryFee, prizePool, maxParticipants, startDate, endDate, rules } = req.body;
        if (!name || !entryFee || !prizePool || !maxParticipants || !startDate || !endDate) {
            throw new error_middleware_1.AppError('Required fields are missing', 400, 'MISSING_FIELDS');
        }
        const tournament = await tournament_service_1.default.createTournament({
            name,
            description,
            entryFee: Number(entryFee),
            prizePool: Number(prizePool),
            maxParticipants: Number(maxParticipants),
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            rules,
        });
        return (0, response_1.createdResponse)(res, tournament, 'Tournament created successfully');
    });
    updateTournament = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const { name, description, entryFee, prizePool, maxParticipants, startDate, endDate, status, rules } = req.body;
        if (!id) {
            throw new error_middleware_1.AppError('Tournament ID is required', 400, 'MISSING_FIELDS');
        }
        const tournament = await tournament_service_1.default.updateTournament(id, {
            name,
            description,
            entryFee: entryFee !== undefined ? Number(entryFee) : undefined,
            prizePool: prizePool !== undefined ? Number(prizePool) : undefined,
            maxParticipants: maxParticipants !== undefined ? Number(maxParticipants) : undefined,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            status,
            rules,
        });
        return (0, response_1.successResponse)(res, tournament, 'Tournament updated successfully');
    });
    deleteTournament = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        if (!id) {
            throw new error_middleware_1.AppError('Tournament ID is required', 400, 'MISSING_FIELDS');
        }
        const result = await tournament_service_1.default.deleteTournament(id);
        return (0, response_1.successResponse)(res, result, 'Tournament deleted successfully');
    });
    startTournament = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        if (!id) {
            throw new error_middleware_1.AppError('Tournament ID is required', 400, 'MISSING_FIELDS');
        }
        const result = await tournament_service_1.default.startTournament(id);
        return (0, response_1.successResponse)(res, result, 'Tournament started successfully');
    });
    endTournament = (0, error_middleware_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const { winnerId } = req.body;
        if (!id) {
            throw new error_middleware_1.AppError('Tournament ID is required', 400, 'MISSING_FIELDS');
        }
        const result = await tournament_service_1.default.endTournament(id, winnerId);
        return (0, response_1.successResponse)(res, result, 'Tournament ended successfully');
    });
}
exports.TournamentController = TournamentController;
exports.default = new TournamentController();
//# sourceMappingURL=tournament.controller.js.map