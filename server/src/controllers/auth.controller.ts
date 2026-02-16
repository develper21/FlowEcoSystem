import { Request, Response } from 'express';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password.utils';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.utils';
import { UserStatus } from '@prisma/client';
import cloudinary from '../config/cloudinary';

// Signup
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      res.status(400).json({
        status: 'error',
        message: 'All fields are required',
      });
      return;
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({
        status: 'error',
        message: 'User with this email already exists',
      });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with NO role initially (Pending Admin Approval)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        roles: [], // No roles assigned yet
        status: UserStatus.PENDING,
      },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        status: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.roles[0] || '', // Primary role (empty if pending)
      roles: user.roles, // All roles
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.roles[0] || '',
      roles: user.roles,
    });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    // Notify Admins about new signup
    const admins = await prisma.user.findMany({
      where: {
        roles: { has: 'ADMIN' }
      },
      select: { id: true }
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          type: 'APPROVAL_REQUIRED',
          title: 'New Account Request',
          message: `${name} has requested to join ECOFlow.`,
          userId: admin.id,
          read: false,
          data: { userId: user.id }
        }))
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: {
        user,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create user',
    });
  }
};

// Login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({
        status: 'error',
        message: 'Email and password are required',
      });
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
      return;
    }

    // Check if user is active
    if (user.status === UserStatus.DISABLED) {
      res.status(403).json({
        status: 'error',
        message: 'Account is disabled',
      });
      return;
    }

    if (user.status === UserStatus.PENDING) {
      res.status(403).json({
        status: 'error',
        message: 'Account is pending approval',
      });
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
      return;
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.roles[0], // Primary role
      roles: user.roles, // All roles
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.roles[0],
      roles: user.roles,
    });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles,
          status: user.status,
          avatar: user.avatar,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to login',
    });
  }
};

// Refresh Token
export const refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        status: 'error',
        message: 'Refresh token is required',
      });
      return;
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Check if refresh token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid refresh token',
      });
      return;
    }

    // Check if token is expired
    if (new Date() > storedToken.expiresAt) {
      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });

      res.status(401).json({
        status: 'error',
        message: 'Refresh token expired',
      });
      return;
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      res.status(401).json({
        status: 'error',
        message: 'User not found or inactive',
      });
      return;
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.roles[0],
      roles: user.roles,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      status: 'error',
      message: 'Invalid or expired refresh token',
    });
  }
};

// Logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Delete refresh token from database
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to logout',
    });
  }
};

// Get current user
export const me = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Not authenticated',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
      message: 'User retrieved successfully',
      data: user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get user',
    });
  }
};

// Change Password
export const changePassword = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      res.status(400).json({
        status: 'error',
        message: 'Current password and new password (min 6 chars) are required',
      });
      return;
    }

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

    const isPasswordValid = await comparePassword(currentPassword, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        status: 'error',
        message: 'Incorrect current password',
      });
      return;
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to change password',
    });
  }
};

// Update Profile
export const updateProfile = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { name, email } = req.body;
    const file = req.file;

    if (!name || !email) {
      res.status(400).json({
        status: 'error',
        message: 'Name and email are required',
      });
      return;
    }

    // Check if email is taken by another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: userId },
        },
      });

      if (existingUser) {
        res.status(409).json({
          status: 'error',
          message: 'Email already in use',
        });
        return;
      }
    }

    let avatarUrl = undefined;
    let avatarPublicId = undefined;
    
    if (file) {
      // Get current user to delete old avatar
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { avatarPublicId: true },
      });

      // Upload to Cloudinary
      const b64 = Buffer.from(file.buffer).toString('base64');
      const dataURI = 'data:' + file.mimetype + ';base64,' + b64;

      try {
        const uploadResponse = await cloudinary.uploader.upload(dataURI, {
          folder: 'ecoflow/avatars',
          resource_type: 'auto',
        });

        avatarUrl = uploadResponse.secure_url;
        avatarPublicId = uploadResponse.public_id;

        // Delete old avatar if exists
        if (currentUser?.avatarPublicId) {
          await cloudinary.uploader.destroy(currentUser.avatarPublicId).catch(() => {
            // Ignore deletion errors
          });
        }
      } catch (uploadError) {
        console.error('Cloudinary upload failed:', uploadError);
        throw new Error('Image upload failed');
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        ...(avatarUrl && { avatar: avatarUrl }),
        ...(avatarPublicId && { avatarPublicId: avatarPublicId })
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        roles: true,
        status: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { user },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile',
    });
  }
};
