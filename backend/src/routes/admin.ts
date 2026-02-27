import { Router, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AdminService } from '../services/admin/adminService';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();
const adminService = new AdminService();

router.use(apiLimiter);

router.get('/stats', authenticate, authorize('admin'), async (_req: AuthRequest, res: Response) => {
  try {
    const stats = await adminService.getSystemStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch system stats' });
  }
});

router.get('/audit-log', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const log = await adminService.getAuditLog(limit, offset);
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

export default router;
