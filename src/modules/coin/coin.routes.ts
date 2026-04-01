import { Router } from 'express';
import coinController from './coin.controller';
import { authenticate, requireAdmin } from '../../shared/middleware/auth.middleware';

const router = Router();

// Public routes (require authentication)
router.get('/packages', authenticate, coinController.getPackages);
router.get('/packages/:id', authenticate, coinController.getPackageById);
router.post('/purchase', authenticate, coinController.purchasePackage);
router.get('/transactions', authenticate, coinController.getTransactions);
router.get('/transactions/:id', authenticate, coinController.getTransactionById);
router.post('/verify-purchase', authenticate, coinController.verifyAndPurchase);

// Admin routes
router.get('/admin/packages', authenticate, requireAdmin, coinController.getAllPackages);
router.post('/admin/packages', authenticate, requireAdmin, coinController.createPackage);
router.put('/admin/packages/:id', authenticate, requireAdmin, coinController.updatePackage);
router.delete('/admin/packages/:id', authenticate, requireAdmin, coinController.deletePackage);
router.get('/admin/transactions', authenticate, requireAdmin, coinController.getAllTransactions);
router.get('/admin/stats', authenticate, requireAdmin, coinController.getStats);

export default router;
