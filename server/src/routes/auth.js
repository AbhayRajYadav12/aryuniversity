import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { config } from '../config.js';
import { authenticate } from '../services/authService.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { issueCsrfToken } from '../middleware/csrf.js';
import { appendAudit } from '../services/auditService.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again later.' },
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.get('/csrf', (_req, res) => {
  const token = issueCsrfToken(res);
  res.json({ csrfToken: token });
});

router.post('/login', loginLimiter, validateBody(loginSchema), async (req, res, next) => {
  try {
    const { token, user } = await authenticate(req.body.email, req.body.password, {
      ip: req.ip,
    });
    res.cookie(config.cookieName, token, {
      httpOnly: true,
      secure: config.cookieSecure,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 1000,
    });
    const csrfToken = issueCsrfToken(res);
    res.json({ user, csrfToken });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    await appendAudit({
      type: 'USER_LOGOUT',
      userId: req.user.id,
      message: `Logout by ${req.user.email}`,
    });
    res.clearCookie(config.cookieName, { path: '/' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({
    user: req.user,
    watermark: {
      name: req.user.name,
      studentId: req.user.studentId || 'N/A',
      email: req.user.email,
      accessedAt: new Date().toISOString(),
    },
  });
});

export default router;
