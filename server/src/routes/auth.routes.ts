import { Router } from 'express';
import { signup, login, refreshAccessToken, logout, me, changePassword, updateProfile } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

/**
 * @route POST /api/auth/signup
 * @desc Register a new user
 * @access Public
 */
router.post('/signup', signup);

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', login);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh', refreshAccessToken);

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Public
 */
router.post('/logout', logout);

/**
 * @route GET /api/auth/me
 * @desc Get current user
 * @access Private
 */


router.get('/me', authenticate, me);
router.post('/change-password', authenticate, changePassword);
router.put('/profile', authenticate, upload.single('avatar'), updateProfile);

export default router;
