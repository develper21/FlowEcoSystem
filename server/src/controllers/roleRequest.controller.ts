import { Request, Response } from 'express';
import prisma from '../config/database';
import { UserRole, AuditAction, EntityType } from '@prisma/client';
import { forceLogoutUser } from './notification.controller';

// User creates a role request
export const createRoleRequest = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { requestedRoles, reason } = req.body;

    // Validation
    if (!requestedRoles || !Array.isArray(requestedRoles) || requestedRoles.length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'Requested roles must be a non-empty array',
      });
      return;
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true, status: true },
    });

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    // Only APPROVED users can request roles (not PENDING)
    if (user.status !== 'ACTIVE') {
      res.status(403).json({
        status: 'error',
        message: 'Only approved users can request additional roles',
      });
      return;
    }

    // Validate roles
    const validRoles = Object.values(UserRole);
    const invalidRoles = requestedRoles.filter((role: string) => !validRoles.includes(role as UserRole));
    
    if (invalidRoles.length > 0) {
      res.status(400).json({
        status: 'error',
        message: `Invalid roles: ${invalidRoles.join(', ')}`,
      });
      return;
    }

    // Block ADMIN requests
    if (requestedRoles.includes(UserRole.ADMIN)) {
      res.status(403).json({
        status: 'error',
        message: 'Cannot request ADMIN role',
      });
      return;
    }

    // Check if user already has these roles
    const alreadyHasRoles = requestedRoles.filter((role: string) => 
      user.roles.includes(role as UserRole)
    );

    if (alreadyHasRoles.length > 0) {
      res.status(400).json({
        status: 'error',
        message: `You already have the following roles: ${alreadyHasRoles.join(', ')}`,
      });
      return;
    }

    // Check for duplicate pending requests
    const existingPendingRequest = await prisma.roleRequest.findFirst({
      where: {
        userId,
        status: 'PENDING',
      },
    });

    if (existingPendingRequest) {
      res.status(409).json({
        status: 'error',
        message: 'You already have a pending role request. Please wait for admin review.',
      });
      return;
    }

    // Create role request
    const roleRequest = await prisma.roleRequest.create({
      data: {
        userId,
        requestedRoles: requestedRoles as UserRole[],
        reason: reason || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            roles: true,
          },
        },
      },
    });

    // Notify admins
    const admins = await prisma.user.findMany({
      where: { roles: { has: UserRole.ADMIN } },
      select: { id: true },
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          type: 'APPROVAL_REQUIRED',
          title: 'New Role Request',
          message: `${roleRequest.user.name} has requested additional roles: ${requestedRoles.join(', ')}`,
          userId: admin.id,
          read: false,
          data: { roleRequestId: roleRequest.id, userId: roleRequest.userId },
        })),
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Role request created successfully',
      data: { roleRequest },
    });
  } catch (error) {
    console.error('Create role request error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create role request',
    });
  }
};

// Get user's own role requests
export const getMyRoleRequests = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const roleRequests = await prisma.roleRequest.findMany({
      where: { userId },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      data: { roleRequests },
    });
  } catch (error) {
    console.error('Get my role requests error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch role requests',
    });
  }
};

// Get all role requests (Admin only)
export const getAllRoleRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const roleRequests = await prisma.roleRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            roles: true,
            status: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // PENDING first
        { createdAt: 'desc' },
      ],
    });

    res.status(200).json({
      status: 'success',
      data: { roleRequests },
    });
  } catch (error) {
    console.error('Get all role requests error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch role requests',
    });
  }
};

// Approve role request (Admin only)
export const approveRoleRequest = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.user?.userId;

    // Get role request
    const roleRequest = await prisma.roleRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            roles: true,
          },
        },
      },
    });

    if (!roleRequest) {
      res.status(404).json({
        status: 'error',
        message: 'Role request not found',
      });
      return;
    }

    if (roleRequest.status !== 'PENDING') {
      res.status(400).json({
        status: 'error',
        message: 'Role request has already been reviewed',
      });
      return;
    }

    // Merge roles (add requested roles to existing roles, remove duplicates)
    const currentRoles = roleRequest.user.roles;
    const newRolesToAdd = roleRequest.requestedRoles.filter(
      (role: UserRole) => !currentRoles.includes(role)
    );
    const updatedRoles = [...currentRoles, ...newRolesToAdd];

    // Update user roles and role request status in a transaction
    const [updatedUser, updatedRequest] = await prisma.$transaction([
      prisma.user.update({
        where: { id: roleRequest.userId },
        data: { roles: updatedRoles },
        select: {
          id: true,
          name: true,
          email: true,
          roles: true,
        },
      }),
      prisma.roleRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              roles: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: EntityType.USER,
        entityId: roleRequest.userId,
        action: AuditAction.ROLE_REQUEST_APPROVED,
        oldValue: JSON.stringify({ roles: currentRoles }),
        newValue: JSON.stringify({ roles: updatedRoles }),
        userId: adminId,
      },
    });

    // Notify user
    await prisma.notification.create({
      data: {
        type: 'APPROVAL_REQUIRED',
        title: 'Role Request Approved',
        message: `Your request for roles ${roleRequest.requestedRoles.join(', ')} has been approved. Please log out and log in again to see your new permissions.`,
        userId: roleRequest.userId,
        read: false,
        data: { roleRequestId: id },
      },
    });

    // CRITICAL: Force logout user so they get new JWT with updated roles
    await forceLogoutUser(roleRequest.userId, `Your role request has been approved! New roles: ${roleRequest.requestedRoles.join(', ')}. Please login again to access your new permissions.`);

    res.status(200).json({
      status: 'success',
      message: 'Role request approved successfully. User will be logged out automatically.',
      data: { 
        roleRequest: updatedRequest,
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error('Approve role request error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to approve role request',
    });
  }
};

// Reject role request (Admin only)
export const rejectRoleRequest = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.user?.userId;

    // Get role request
    const roleRequest = await prisma.roleRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            roles: true,
          },
        },
      },
    });

    if (!roleRequest) {
      res.status(404).json({
        status: 'error',
        message: 'Role request not found',
      });
      return;
    }

    if (roleRequest.status !== 'PENDING') {
      res.status(400).json({
        status: 'error',
        message: 'Role request has already been reviewed',
      });
      return;
    }

    // Update role request status
    const updatedRequest = await prisma.roleRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            roles: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: EntityType.USER,
        entityId: roleRequest.userId,
        action: AuditAction.ROLE_REQUEST_REJECTED,
        oldValue: JSON.stringify({ requestedRoles: roleRequest.requestedRoles }),
        newValue: JSON.stringify({ status: 'REJECTED' }),
        userId: adminId,
      },
    });

    // Notify user
    await prisma.notification.create({
      data: {
        type: 'APPROVAL_REQUIRED',
        title: 'Role Request Rejected',
        message: `Your request for roles ${roleRequest.requestedRoles.join(', ')} has been rejected by an administrator.`,
        userId: roleRequest.userId,
        read: false,
        data: { roleRequestId: id },
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Role request rejected successfully',
      data: { roleRequest: updatedRequest },
    });
  } catch (error) {
    console.error('Reject role request error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reject role request',
    });
  }
};
