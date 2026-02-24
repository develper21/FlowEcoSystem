import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { uploadAttachment } from '../middlewares/upload.middleware';
import {
  uploadProductAttachment,
  getProductAttachments,
  deleteProductAttachment,
  uploadECOAttachment,
  getECOAttachments,
  deleteECOAttachment,
} from '../controllers/attachment.controller';

const router = Router();

// ========================================
// PRODUCT ATTACHMENTS
// ========================================

// Upload product attachment (ENGINEER or ADMIN only)
router.post(
  '/products/:id/attachments',
  authenticate,
  authorize('ENGINEERING', 'ADMIN'),
  uploadAttachment.single('file'),
  uploadProductAttachment
);

// Get product attachments (All authenticated users can view)
router.get(
  '/products/:id/attachments',
  authenticate,
  getProductAttachments
);

// Delete product attachment (ENGINEER/ADMIN, only in DRAFT status)
router.delete(
  '/products/attachments/:id',
  authenticate,
  authorize('ENGINEERING', 'ADMIN'),
  deleteProductAttachment
);

// ========================================
// ECO ATTACHMENTS
// ========================================

// Upload ECO attachment (ENGINEER or ADMIN only, DRAFT status only)
router.post(
  '/ecos/:id/attachments',
  authenticate,
  authorize('ENGINEERING', 'ADMIN'),
  uploadAttachment.single('file'),
  uploadECOAttachment
);

// Get ECO attachments (All authenticated users can view)
router.get(
  '/ecos/:id/attachments',
  authenticate,
  getECOAttachments
);

// Delete ECO attachment (ECO creator/uploader/ADMIN, DRAFT status only)
router.delete(
  '/ecos/attachments/:id',
  authenticate,
  authorize('ENGINEERING', 'ADMIN'),
  deleteECOAttachment
);

export default router;
