import { Response } from 'express';
import prisma from '../config/database';

// Store active SSE connections
const clients = new Map<string, Response>();

// Force logout a specific user by sending SSE event and invalidating tokens
export const forceLogoutUser = async (userId: string, reason: string = 'Your roles have been updated. Please login again.'): Promise<void> => {
  try {
    // Delete all refresh tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    // Send force_logout event via SSE if user is connected
    const client = clients.get(userId);
    if (client) {
      client.write(`data: ${JSON.stringify({ 
        type: 'force_logout', 
        message: reason,
        timestamp: new Date().toISOString()
      })}\n\n`);
    }

    console.log(`🔐 Force logout triggered for user ${userId}: ${reason}`);
  } catch (error) {
    console.error('Error forcing logout:', error);
  }
};

// SSE endpoint for real-time notifications
export const streamEvents = (req: any, res: Response): void => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for nginx

  // Add client to active connections
  clients.set(userId, res);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connected' })}\n\n`);

  // Send unread notifications count
  prisma.notification.count({
    where: {
      userId,
      read: false,
    },
  }).then((count) => {
    res.write(`data: ${JSON.stringify({ type: 'unread_count', count })}\n\n`);
  });

  // Handle client disconnect
  req.on('close', () => {
    clients.delete(userId);
    res.end();
  });
};

// Send notification to specific user
export const sendNotificationToUser = async (
  userId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }
): Promise<void> => {
  try {
    // Store notification in database
    const savedNotification = await prisma.notification.create({
      data: {
        type: notification.type as any,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        userId,
        read: false,
      },
    });

    // Send via SSE if user is connected
    const client = clients.get(userId);
    if (client) {
      client.write(`data: ${JSON.stringify(savedNotification)}\n\n`);
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Broadcast notification to all connected users
export const broadcastNotification = async (notification: {
  type: string;
  title: string;
  message: string;
  data?: any;
}): Promise<void> => {
  try {
    // Store as broadcast notification
    const savedNotification = await prisma.notification.create({
      data: {
        type: notification.type as any,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        userId: null, // Broadcast
        read: false,
      },
    });

    // Send to all connected clients
    clients.forEach((client) => {
      client.write(`data: ${JSON.stringify(savedNotification)}\n\n`);
    });
  } catch (error) {
    console.error('Error broadcasting notification:', error);
  }
};

// Express handler for broadcasting notifications
export const broadcastNotificationHandler = async (req: any, res: Response): Promise<void> => {
  try {
    const { type, title, message, data } = req.body;

    if (!type || !title || !message) {
      res.status(400).json({
        status: 'error',
        message: 'Type, title, and message are required',
      });
      return;
    }

    // Get all users to send notifications to
    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });

    // Create notifications for all users
    await Promise.all(
      users.map((user) =>
        prisma.notification.create({
          data: {
            type: type as any,
            title,
            message,
            data: data || {},
            userId: user.id,
            read: false,
          },
        })
      )
    );

    // Send via SSE to connected clients
    const notificationData = { type, title, message, data };
    clients.forEach((client) => {
      client.write(`data: ${JSON.stringify(notificationData)}\n\n`);
    });

    res.status(200).json({
      status: 'success',
      message: 'Notification broadcast successfully',
      data: { count: users.length },
    });
  } catch (error: any) {
    console.error('Error broadcasting notification:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to broadcast notification',
    });
  }
};

// Express handler for sending notification to specific user
export const sendNotificationToUserHandler = async (req: any, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { type, title, message, data } = req.body;

    if (!type || !title || !message) {
      res.status(400).json({
        status: 'error',
        message: 'Type, title, and message are required',
      });
      return;
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // Create notification
    const savedNotification = await prisma.notification.create({
      data: {
        type: type as any,
        title,
        message,
        data: data || {},
        userId,
        read: false,
      },
    });

    // Send via SSE if user is connected
    const client = clients.get(userId);
    if (client) {
      client.write(`data: ${JSON.stringify(savedNotification)}\n\n`);
    }

    res.status(200).json({
      status: 'success',
      message: 'Notification sent successfully',
      data: savedNotification,
    });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to send notification',
    });
  }
};

// Get user notifications
export const getNotifications = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { page = '1', limit = '20', unreadOnly = 'false' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {
      OR: [
        { userId }, // User-specific notifications
        { userId: null }, // Broadcast notifications
      ],
    };

    if (unreadOnly === 'true') {
      where.read = false;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.notification.count({ where }),
    ]);

    res.status(200).json({
      status: 'success',
      data: notifications,
      pagination: {
        page: parseInt(page as string),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get notifications',
    });
  }
};

// Mark notification as read
export const markAsRead = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      res.status(404).json({
        status: 'error',
        message: 'Notification not found',
      });
      return;
    }

    // Only allow marking user's own notifications
    if (notification.userId && notification.userId !== userId) {
      res.status(403).json({
        status: 'error',
        message: 'Access denied',
      });
      return;
    }

    await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark notification as read',
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    await prisma.notification.updateMany({
      where: {
        OR: [{ userId }, { userId: null }],
        read: false,
      },
      data: { read: true },
    });

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark all notifications as read',
    });
  }
};

// Delete notification
export const deleteNotification = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      res.status(404).json({
        status: 'error',
        message: 'Notification not found',
      });
      return;
    }

    // Only allow deleting user's own notifications
    if (notification.userId && notification.userId !== userId) {
      res.status(403).json({
        status: 'error',
        message: 'Access denied',
      });
      return;
    }

    await prisma.notification.delete({
      where: { id },
    });

    res.status(200).json({
      status: 'success',
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete notification',
    });
  }
};
