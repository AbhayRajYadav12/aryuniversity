import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getBookInternal, decryptBookContent, recordReadingEvent } from '../services/bookService.js';
import { assertDocumentAccess } from '../services/permissionService.js';
import { appendAudit } from '../services/auditService.js';

const router = Router();

router.get('/:id/content', requireAuth, async (req, res, next) => {
  try {
    const book = await getBookInternal(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const access = await assertDocumentAccess(req.user, book.id);
    if (!access.allowed) {
      await appendAudit({
        type: 'UNAUTHORIZED_ACCESS',
        userId: req.user.id,
        bookId: book.id,
        reason: access.reason,
        message: `Denied document access (${access.reason})`,
      });
      return res.status(403).json({
        error: 'Access denied',
        reason: access.reason,
      });
    }

    let plaintext;
    try {
      plaintext = await decryptBookContent(book);
    } catch (err) {
      if (err.code === 'TAMPER_DETECTED') {
        await appendAudit({
          type: 'INTEGRITY_VERIFICATION_FAILED',
          userId: req.user.id,
          bookId: book.id,
          message: 'GCM authentication tag verification failed',
        });
        return res.status(403).json({
          error: err.message,
          code: 'TAMPER_DETECTED',
        });
      }
      throw err;
    }

    await appendAudit({
      type: 'DOCUMENT_ACCESSED',
      userId: req.user.id,
      bookId: book.id,
      message: `Decrypted and streamed "${book.title}"`,
    });

    await recordReadingEvent({ userId: req.user.id, bookId: book.id });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="protected.pdf"');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(plaintext);
    // plaintext Buffer will be GC'd; never written to disk
  } catch (err) {
    next(err);
  }
});

router.post('/:id/access-event', requireAuth, async (req, res, next) => {
  try {
    const book = await getBookInternal(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const access = await assertDocumentAccess(req.user, book.id);
    if (!access.allowed) {
      return res.status(403).json({ error: 'Access denied', reason: access.reason });
    }

    const entry = await recordReadingEvent({
      userId: req.user.id,
      bookId: book.id,
    });
    res.json({ entry });
  } catch (err) {
    next(err);
  }
});

export default router;
