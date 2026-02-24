import express from 'express';
import {
  getActiveProducts,
  getActiveBOMs,
  getActiveProductById,
  getActiveBOMById,
  getActiveMatrix,
} from '../controllers/operations.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

/**
 * OPERATIONS Routes
 * 
 * CRITICAL: These routes are EXCLUSIVELY for OPERATIONS role.
 * They enforce that only ACTIVE products/BOMs are visible.
 * No DRAFT or ARCHIVED data is exposed to operations users.
 */

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// All routes are restricted to OPERATIONS and ADMIN roles only
router.use(authorize('OPERATIONS', 'ADMIN'));

// Get only active products
router.get('/products', getActiveProducts);

// Get only active BOMs
router.get('/boms', getActiveBOMs);

// Get specific active product
router.get('/products/:id', getActiveProductById);

// Get specific active BOM
router.get('/boms/:id', getActiveBOMById);

// Get active product-version-BOM matrix
router.get('/active-matrix', getActiveMatrix);

export default router;
