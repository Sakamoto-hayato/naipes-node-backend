import { Router } from 'express';
import withdrawalController from './withdrawal.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// User routes
router.post('/', withdrawalController.createRequest);
router.get('/my-requests', withdrawalController.getMyRequests);
router.get('/:id', withdrawalController.getRequestById);
router.post('/:id/cancel', withdrawalController.cancelRequest);

// Admin routes
router.get('/admin/all', withdrawalController.getAllRequests);
router.put('/admin/:id', withdrawalController.updateRequest);
router.get('/admin/stats', withdrawalController.getStats);

export default router;
