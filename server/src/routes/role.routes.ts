import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  assignRoles,
  addRole,
  removeRole,
  getUserRoles,
} from '../controllers/role.controller';

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('ADMIN'));

// Role management routes
router.put('/users/:id/roles', assignRoles); // Assign multiple roles
router.post('/users/:id/roles', addRole); // Add single role
router.delete('/users/:id/roles', removeRole); // Remove single role
router.get('/users/:id/roles', getUserRoles); // Get user roles

export default router;
