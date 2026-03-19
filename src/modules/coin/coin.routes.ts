import { Router } from 'express';
import coinController from './coin.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';

const router = Router();

// Public routes (require authentication)
router.get('/packages', authenticate, coinController.getPackages);
router.get('/packages/:id', authenticate, coinController.getPackageById);
router.post('/purchase', authenticate, coinController.purchasePackage);
router.get('/transactions', authenticate, coinController.getTransactions);
router.get('/transactions/:id', authenticate, coinController.getTransactionById);

// Admin routes (TODO: add admin middleware)
router.get('/admin/packages', authenticate, coinController.getAllPackages);
router.post('/admin/packages', authenticate, coinController.createPackage);
router.put('/admin/packages/:id', authenticate, coinController.updatePackage);
router.delete('/admin/packages/:id', authenticate, coinController.deletePackage);
router.get('/admin/transactions', authenticate, coinController.getAllTransactions);
router.get('/admin/stats', authenticate, coinController.getStats);

export default router;
