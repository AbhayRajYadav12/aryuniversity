import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getReadingHistory } from '../services/bookService.js';

const router = Router();

router.get('/history', requireAuth, async (req, res, next) => {
  try {
    const history = await getReadingHistory(req.user.id);
    res.json({ history });
  } catch (err) {
    next(err);
  }
});

export default router;
