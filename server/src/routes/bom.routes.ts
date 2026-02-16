import express from 'express';
import {
  createBOM,
  getAllBOMs,
  getBOMById,
  updateBOM,
  addComponent,
  addOperation,
  removeComponent,
  removeOperation,
  publishBOM,
} from '../controllers/bom.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('ADMIN', 'ENGINEERING'), createBOM);
router.get('/', getAllBOMs);
router.get('/:id', getBOMById);
router.put('/:id', authorize('ADMIN', 'ENGINEERING'), updateBOM);
router.post('/:id/publish', authorize('ADMIN', 'ENGINEERING'), publishBOM);
router.post('/:id/components', authorize('ADMIN', 'ENGINEERING'), addComponent);
router.delete('/:id/components/:componentId', authorize('ADMIN', 'ENGINEERING'), removeComponent);
router.post('/:id/operations', authorize('ADMIN', 'ENGINEERING'), addOperation);
router.delete('/:id/operations/:operationId', authorize('ADMIN', 'ENGINEERING'), removeOperation);

export default router;
