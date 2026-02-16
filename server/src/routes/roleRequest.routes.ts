import { Router } from 'express';
import {
  createRoleRequest,
  getMyRoleRequests,
  getAllRoleRequests,
  approveRoleRequest,
  rejectRoleRequest,
} from '../controllers/roleRequest.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// User role request routes (authenticated users)
router.post('/', authenticate, createRoleRequest);
router.get('/me', authenticate, getMyRoleRequests);

// Admin role request routes (admin only)
router.get('/admin/all', authenticate, authorize('ADMIN'), getAllRoleRequests);
router.patch('/admin/:id/approve', authenticate, authorize('ADMIN'), approveRoleRequest);
router.patch('/admin/:id/reject', authenticate, authorize('ADMIN'), rejectRoleRequest);

export default router;
