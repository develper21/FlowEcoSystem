import { Request, Response } from 'express';
import prisma from '../config/database';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.utils';

// Upload product attachment
export const uploadProductAttachment = async (req: any, res: Response): Promise<void> => {
  try {
    const { id: productVersionId } = req.params;
    const userId = req.user?.userId;
    const file = req.file;

    if (!file) {
      res.status(400).json({
        status: 'error',
        message: 'No file provided',
      });
      return;
    }

    // Verify product version exists
    const productVersion = await prisma.productVersion.findUnique({
      where: { id: productVersionId },
      select: { id: true, status: true },
    });

    if (!productVersion) {
      res.status(404).json({
        status: 'error',
        message: 'Product version not found',
      });
      return;
    }

    // Upload to Cloudinary
    const { url, publicId } = await uploadToCloudinary(
      file.buffer,
      file.mimetype,
      'product-attachments'
    );

    // Save to database
    const attachment = await prisma.productAttachment.create({
      data: {
        productVersionId,
        url,
        publicId,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        uploadedBy: userId,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Attachment uploaded successfully',
      data: { attachment },
    });
  } catch (error: any) {
    console.error('Upload product attachment error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to upload attachment',
    });
  }
};

// Get product attachments
export const getProductAttachments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: productVersionId } = req.params;

    const attachments = await prisma.productAttachment.findMany({
      where: { productVersionId },
      include: {
        uploader: {
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
      data: { attachments },
    });
  } catch (error: any) {
    console.error('Get product attachments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch attachments',
    });
  }
};

// Delete product attachment
export const deleteProductAttachment = async (req: any, res: Response): Promise<void> => {
  try {
    const { id: attachmentId } = req.params;
    const userId = req.user?.userId;
    const userRoles = req.user?.roles || [];

    // Get attachment
    const attachment = await prisma.productAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        productVersion: {
          select: { status: true },
        },
      },
    });

    if (!attachment) {
      res.status(404).json({
        status: 'error',
        message: 'Attachment not found',
      });
      return;
    }

    // Permission check: Only uploader or ADMIN can delete
    const isAdmin = userRoles.includes('ADMIN');
    const isUploader = attachment.uploadedBy === userId;

    if (!isAdmin && !isUploader) {
      res.status(403).json({
        status: 'error',
        message: 'You do not have permission to delete this attachment',
      });
      return;
    }

    // Cannot delete from ACTIVE or ARCHIVED product versions (all versions are immutable)
    if (attachment.productVersion.status === 'ACTIVE' || attachment.productVersion.status === 'ARCHIVED') {
      res.status(400).json({
        status: 'error',
        message: `Cannot delete attachments from ${attachment.productVersion.status} product version. Product versions are immutable.`,
      });
      return;
    }

    // Delete from Cloudinary
    await deleteFromCloudinary(attachment.publicId);

    // Delete from database
    await prisma.productAttachment.delete({
      where: { id: attachmentId },
    });

    res.status(200).json({
      status: 'success',
      message: 'Attachment deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete product attachment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete attachment',
    });
  }
};

// ========================================
// ECO ATTACHMENTS
// ========================================

// Upload ECO attachment
export const uploadECOAttachment = async (req: any, res: Response): Promise<void> => {
  try {
    const { id: ecoId } = req.params;
    const userId = req.user?.userId;
    const file = req.file;

    if (!file) {
      res.status(400).json({
        status: 'error',
        message: 'No file provided',
      });
      return;
    }

    // Verify ECO exists and check status
    const eco = await prisma.eCO.findUnique({
      where: { id: ecoId },
      select: { id: true, status: true, createdBy: true },
    });

    if (!eco) {
      res.status(404).json({
        status: 'error',
        message: 'ECO not found',
      });
      return;
    }

    // Only allow uploads in DRAFT status
    if (eco.status !== 'DRAFT') {
      res.status(400).json({
        status: 'error',
        message: `Cannot upload attachments to ECO in ${eco.status} status. Attachments can only be added in DRAFT stage.`,
      });
      return;
    }

    // Upload to Cloudinary
    const { url, publicId } = await uploadToCloudinary(
      file.buffer,
      file.mimetype,
      'eco-attachments'
    );

    // Save to database
    const attachment = await prisma.eCOAttachment.create({
      data: {
        ecoId,
        url,
        publicId,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        uploadedBy: userId,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Attachment uploaded successfully',
      data: { attachment },
    });
  } catch (error: any) {
    console.error('Upload ECO attachment error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to upload attachment',
    });
  }
};

// Get ECO attachments
export const getECOAttachments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: ecoId } = req.params;

    const attachments = await prisma.eCOAttachment.findMany({
      where: { ecoId },
      include: {
        uploader: {
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
      data: { attachments },
    });
  } catch (error: any) {
    console.error('Get ECO attachments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch attachments',
    });
  }
};

// Delete ECO attachment
export const deleteECOAttachment = async (req: any, res: Response): Promise<void> => {
  try {
    const { id: attachmentId } = req.params;
    const userId = req.user?.userId;
    const userRoles = req.user?.roles || [];

    // Get attachment with ECO status
    const attachment = await prisma.eCOAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        eco: {
          select: { status: true, createdBy: true },
        },
      },
    });

    if (!attachment) {
      res.status(404).json({
        status: 'error',
        message: 'Attachment not found',
      });
      return;
    }

    // Only allow deletion in DRAFT status
    if (attachment.eco.status !== 'DRAFT') {
      res.status(400).json({
        status: 'error',
        message: `Cannot delete attachments from ECO in ${attachment.eco.status} status. Attachments can only be deleted in DRAFT stage.`,
      });
      return;
    }

    // Permission check: ECO creator, uploader, or ADMIN
    const isAdmin = userRoles.includes('ADMIN');
    const isUploader = attachment.uploadedBy === userId;
    const isECOCreator = attachment.eco.createdBy === userId;

    if (!isAdmin && !isUploader && !isECOCreator) {
      res.status(403).json({
        status: 'error',
        message: 'You do not have permission to delete this attachment',
      });
      return;
    }

    // Delete from Cloudinary
    await deleteFromCloudinary(attachment.publicId);

    // Delete from database
    await prisma.eCOAttachment.delete({
      where: { id: attachmentId },
    });

    res.status(200).json({
      status: 'success',
      message: 'Attachment deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete ECO attachment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete attachment',
    });
  }
};

