import { Request, Response } from 'express';
import prisma from '../config/database';
import { hashPassword } from '../utils/password.utils';
import { UserStatus } from '@prisma/client';
import { sendNotificationToUser } from './notification.controller';

// Get all users (Admin only)
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, status, search, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          roles: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users',
    });
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user',
    });
  }
};

// Update user
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, role, email, status } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (role) updateData.roles = [role]; // Map single role to array
    if (email) updateData.email = email;
    if (status) updateData.status = status;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        status: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      data: { user },
    });

    if (status) {
      await updateUserStatusNotificationLogic(id, status);
    }

    if (status) {
      await updateUserStatusNotificationLogic(id, status);
    }
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({
        status: 'error',
        message: 'Email already exists',
      });
      return;
    }
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user',
    });
  }
};

// Update user status (enable/disable) for notifications
export const updateUserStatusNotificationLogic = async (id: string, status: string) => {
  // Notify user if status changed
  if (status === 'ACTIVE') {
    await sendNotificationToUser(id, {
      type: 'SUCCESS',
      title: 'Account Activated',
      message: 'Your account has been approved and activated. You can now access the system.',
    });
  } else if (status === 'DISABLED') {
    // Optionally notify them
    await sendNotificationToUser(id, {
      type: 'WARNING',
      title: 'Account Disabled',
      message: 'Your account has been disabled by an administrator.',
    });
  }
};

// Update user status (enable/disable)
export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['ACTIVE', 'DISABLED'].includes(status)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid status. Must be ACTIVE or DISABLED',
      });
      return;
    }

    const user = await prisma.user.update({
      where: { id },
      data: { status: status as UserStatus },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        status: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      status: 'success',
      message: `User ${status === 'ACTIVE' ? 'enabled' : 'disabled'} successfully`,
      data: { user },
    });

    await updateUserStatusNotificationLogic(id, status);
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user status',
    });
  }
};

// Delete user (soft delete by disabling)
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // Soft delete by disabling
    await prisma.user.update({
      where: { id },
      data: { status: UserStatus.DISABLED },
    });

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete user',
    });
  }
};

// Reset user password (Admin only)
export const resetUserPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters',
      });
      return;
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to reset password',
    });
  }
};
