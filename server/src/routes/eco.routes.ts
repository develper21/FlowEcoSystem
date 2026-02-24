import express from 'express';
import {
  createECO,
  getAllECOs,
  getECOById,
  updateECO,
  submitECO,
  reviewECO,
  applyECO,
  addECOComponentDraft,
  updateECOComponentDraft,
  removeECOComponentDraft,
  addECOOperationDraft,
  updateECOOperationDraft,
  removeECOOperationDraft,
} from '../controllers/eco.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('ENGINEERING', 'ADMIN'), createECO);
router.get('/', authorize('ENGINEERING', 'APPROVER', 'ADMIN'), getAllECOs);
router.get('/:id', authorize('ENGINEERING', 'APPROVER', 'ADMIN'), getECOById);
router.put('/:id', authorize('ENGINEERING', 'ADMIN'), updateECO);
router.post('/:id/submit', authorize('ENGINEERING', 'ADMIN'), submitECO);
router.post('/:id/review', authorize('APPROVER', 'ADMIN'), reviewECO);
router.post('/:id/apply', authorize('ADMIN'), applyECO);

// BOM ECO Draft Management
router.post('/:id/draft/components', authorize('ENGINEERING', 'ADMIN'), addECOComponentDraft);
router.put('/:id/draft/components/:draftId', authorize('ENGINEERING', 'ADMIN'), updateECOComponentDraft);
router.delete('/:id/draft/components/:draftId', authorize('ENGINEERING', 'ADMIN'), removeECOComponentDraft);
router.post('/:id/draft/operations', authorize('ENGINEERING', 'ADMIN'), addECOOperationDraft);
router.put('/:id/draft/operations/:draftId', authorize('ENGINEERING', 'ADMIN'), updateECOOperationDraft);
router.delete('/:id/draft/operations/:draftId', authorize('ENGINEERING', 'ADMIN'), removeECOOperationDraft);

export default router;
