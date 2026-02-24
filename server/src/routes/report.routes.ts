import express from 'express';
import { 
  getAuditLogs, 
  getECOStats,
  getProductVersionHistory,
  getBOMChangeHistory,
  getArchivedProducts,
  getActiveProductMatrix,
} from '../controllers/report.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = express.Router();

router.use(authenticate);

router.get('/audit-logs', authorize('ADMIN'), getAuditLogs);
router.get('/eco-stats', getECOStats);

// CRITICAL FIX: New report endpoints (Gaps #9, #10)
router.get('/products/:id/version-history', getProductVersionHistory);
router.get('/product-versions/:id/bom-history', getBOMChangeHistory);
router.get('/archived-products', getArchivedProducts);
router.get('/active-matrix', getActiveProductMatrix);

export default router;
