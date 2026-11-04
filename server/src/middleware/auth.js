import { config } from '../config.js';
import { verifyToken, findUserById } from '../services/authService.js';
import { sanitizeUser } from '../utils/hash.js';

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[config.cookieName];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }
    const user = await findUserById(payload.sub);
    if (!user || !user.active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }
    req.user = sanitizeUser(user);
    req.tokenPayload = payload;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient privileges' });
    }
    next();
  };
}

export async function optionalAuth(req, _res, next) {
  try {
    const token = req.cookies?.[config.cookieName];
    if (token) {
      try {
        const payload = verifyToken(token);
        const user = await findUserById(payload.sub);
        if (user?.active) req.user = sanitizeUser(user);
      } catch {
        /* ignore */
      }
    }
    next();
  } catch (err) {
    next(err);
  }
}
