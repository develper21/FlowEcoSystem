import express from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  updateProductVersion,
  deleteProduct,
  archiveProduct,
  createProductVersion,
} from '../controllers/product.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('ADMIN', 'ENGINEERING'), createProduct);
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.put('/:id', authorize('ADMIN', 'ENGINEERING'), updateProduct);
router.delete('/:id', authorize('ADMIN'), deleteProduct);
router.patch('/:id/archive', authorize('ADMIN'), archiveProduct);
router.post('/:id/versions', authorize('ADMIN', 'ENGINEERING'), createProductVersion);
router.put('/versions/:id', authorize('ADMIN', 'ENGINEERING'), updateProductVersion);

export default router;
