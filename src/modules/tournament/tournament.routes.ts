import { Router } from 'express';
import tournamentController from './tournament.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/join', tournamentController.join);
router.get('/find-match', tournamentController.findMatch);
router.get('/status', tournamentController.getStatus);
router.get('/ranking', tournamentController.getRanking);

export default router;
