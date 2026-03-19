import { Router } from 'express';
import friendController from './friend.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';

const router = Router();

// All friend routes require authentication
router.use(authenticate);

// Friend management routes
router.get('/', friendController.getFriends);                          // GET /api/friends
router.get('/requests', friendController.getFriendRequests);            // GET /api/friends/requests
router.get('/blocked', friendController.getBlockedUsers);              // GET /api/friends/blocked

router.post('/request', friendController.sendFriendRequest);           // POST /api/friends/request
router.put('/accept/:id', friendController.acceptFriendRequest);       // PUT /api/friends/accept/:id
router.delete('/reject/:id', friendController.rejectFriendRequest);     // DELETE /api/friends/reject/:id
router.delete('/:id', friendController.removeFriend);                   // DELETE /api/friends/:id

// Block/Unblock routes
router.post('/block/:id', friendController.blockUser);                 // POST /api/friends/block/:id
router.post('/unblock/:id', friendController.unblockUser);             // POST /api/friends/unblock/:id

export default router;
