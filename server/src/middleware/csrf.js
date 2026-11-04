import crypto from 'crypto';
import { config } from '../config.js';

export function issueCsrfToken(res) {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie(config.csrfCookieName, token, {
    httpOnly: false,
    secure: config.cookieSecure,
    sameSite: 'strict',
    path: '/',
  });
  return token;
}

export function csrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  // Login and CSRF bootstrap are exempt
  const path = req.path || '';
  if (path.endsWith('/auth/login') || path.endsWith('/auth/csrf')) {
    return next();
  }
  const cookieToken = req.cookies?.[config.csrfCookieName];
  const headerToken = req.get('x-csrf-token');
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  next();
}
