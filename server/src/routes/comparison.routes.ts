import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  getECOComparison,
  getProductVersionHistory,
  getBomVersionComparison,
} from '../controllers/comparison.controller';

const router = Router();

router.use(authenticate);

// ECO comparison endpoints
router.get('/ecos/:id/comparison', getECOComparison);
router.get('/products/:productId/versions', getProductVersionHistory);
router.get('/boms/:bomId/comparison/:oldVersion/:newVersion', getBomVersionComparison);

export default router;
