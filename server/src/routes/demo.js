import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { runSecurityDemo } from '../services/securityDemoService.js';
import { appendAudit } from '../services/auditService.js';

const router = Router();

router.post('/run', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const report = await runSecurityDemo();
    await appendAudit({
      type: 'SECURITY_DEMO',
      actorId: req.user.id,
      message: `Security demo ran: ${report.passed}/${report.total} passed`,
    });
    res.json(report);
  } catch (err) {
    next(err);
  }
});

export default router;
