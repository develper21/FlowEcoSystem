import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  streamEvents,
  broadcastNotificationHandler,
  sendNotificationToUserHandler,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notification.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// SSE stream endpoint
router.get('/stream', streamEvents);

// Send notifications (ADMIN only)
router.post('/broadcast', authorize('ADMIN'), broadcastNotificationHandler);
router.post('/users/:userId', authorize('ADMIN'), sendNotificationToUserHandler);

// Notification management
router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);

export default router;
