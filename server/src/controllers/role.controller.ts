import { Request, Response } from 'express';
import prisma from '../config/database';
import { UserRole, AuditAction, EntityType } from '@prisma/client';
import { forceLogoutUser } from './notification.controller';

// Assign roles to user (Admin only)
export const assignRoles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { roles } = req.body;

    if (!roles || !Array.isArray(roles)) {
      res.status(400).json({
        status: 'error',
        message: 'Roles array is required',
      });
      return;
    }

    // Validate roles
    const validRoles = Object.values(UserRole);
    const invalidRoles = roles.filter((role: string) => !validRoles.includes(role as UserRole));

    if (invalidRoles.length > 0) {
      res.status(400).json({
        status: 'error',
        message: `Invalid roles: ${invalidRoles.join(', ')}`,
      });
      return;
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        roles: roles as UserRole[],
      },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        status: true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: AuditAction.UPDATE,
        entityType: EntityType.USER,
        entityId: id,
        oldValue: {}, // Previous roles
        newValue: { roles },
        userId: (req as any).user?.userId,
      },
    });

    // CRITICAL: Force logout user so they get new JWT with updated roles
    await forceLogoutUser(id, `Your roles have been updated to: ${roles.join(', ')}. Please login again to access your new permissions.`);

    res.status(200).json({
      status: 'success',
      message: 'Roles assigned successfully. User will be logged out automatically.',
      data: user,
    });
  } catch (error) {
    console.error('Assign roles error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to assign roles',
    });
  }
};

// Add role to user
export const addRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !Object.values(UserRole).includes(role as UserRole)) {
      res.status(400).json({
        status: 'error',
        message: 'Valid role is required',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // Check if role already exists
    if (user.roles.includes(role as UserRole)) {
      res.status(400).json({
        status: 'error',
        message: 'User already has this role',
      });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        roles: [...user.roles, role as UserRole],
      },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        status: true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: AuditAction.UPDATE,
        entityType: EntityType.USER,
        entityId: id,
        oldValue: { roles: user.roles },
        newValue: { roles: updatedUser.roles },
        userId: (req as any).user?.userId,
      },
    });

    // CRITICAL: Force logout user so they get new JWT with updated roles
    await forceLogoutUser(id, `Role "${role}" has been added to your account. Please login again to access your new permissions.`);

    res.status(200).json({
      status: 'success',
      message: 'Role added successfully. User will be logged out automatically.',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Add role error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add role',
    });
  }
};

// Remove role from user
export const removeRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      res.status(400).json({
        status: 'error',
        message: 'Role is required',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // Check if user has the role
    if (!user.roles.includes(role as UserRole)) {
      res.status(400).json({
        status: 'error',
        message: 'User does not have this role',
      });
      return;
    }

    // Don't allow removing last role
    if (user.roles.length === 1) {
      res.status(400).json({
        status: 'error',
        message: 'Cannot remove the last role from user',
      });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        roles: user.roles.filter((r) => r !== role),
      },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        status: true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: AuditAction.UPDATE,
        entityType: EntityType.USER,
        entityId: id,
        oldValue: { roles: user.roles },
        newValue: { roles: updatedUser.roles },
        userId: (req as any).user?.userId,
      },
    });

    // CRITICAL: Force logout user so they get new JWT with updated roles
    await forceLogoutUser(id, `Role "${role}" has been removed from your account. Please login again.`);

    res.status(200).json({
      status: 'success',
      message: 'Role removed successfully. User will be logged out automatically.',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Remove role error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove role',
    });
  }
};

// Get user roles
export const getUserRoles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
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
      data: {
        userId: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
    });
  } catch (error) {
    console.error('Get user roles error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get user roles',
    });
  }
};
