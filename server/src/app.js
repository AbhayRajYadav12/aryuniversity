import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { csrfProtection } from './middleware/csrf.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import booksRoutes from './routes/books.js';
import meRoutes from './routes/me.js';
import adminRoutes from './routes/admin.js';
import documentsRoutes from './routes/documents.js';
import demoRoutes from './routes/demo.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'same-origin' },
      contentSecurityPolicy: false,
    })
  );

  app.use(
    cors({
      origin: config.clientOrigin,
      credentials: true,
    })
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(csrfProtection);

  // Never expose data/encrypted or data/keys via static hosting
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'university-digital-library' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/books', booksRoutes);
  app.use('/api/me', meRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/documents', documentsRoutes);
  app.use('/api/demo', demoRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
