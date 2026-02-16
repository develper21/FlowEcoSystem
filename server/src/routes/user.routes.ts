import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser,
  resetUserPassword,
} from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = express.Router();

// All user routes require authentication and Admin role
router.use(authenticate);
router.use(authorize('ADMIN'));

// User management routes
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.patch('/:id/status', updateUserStatus);
router.patch('/:id/password', resetUserPassword);
router.delete('/:id', deleteUser);

export default router;
