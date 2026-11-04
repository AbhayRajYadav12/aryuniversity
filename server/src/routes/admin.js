import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { config } from '../config.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { getAdminStats } from '../services/statsService.js';
import {
  listBooks,
  uploadAndEncryptBook,
  updateBook,
  deleteBook,
  publicBook,
  encryptionDetail,
  getBookInternal,
} from '../services/bookService.js';
import { ciphertextPreview } from '../services/cryptoService.js';
import {
  listUsers,
  createUser,
  updateUser,
  setUserPassword,
  sanitizeUserSafe,
} from '../services/adminUsers.js';
import {
  listPermissions as listAllPermissions,
  grantPermission,
  revokePermission,
} from '../services/permissionService.js';
import { getAuditLogs } from '../services/auditService.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes },
  fileFilter(_req, file, cb) {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF uploads are allowed'));
    }
    cb(null, true);
  },
});

router.get('/stats', async (_req, res, next) => {
  try {
    res.json(await getAdminStats());
  } catch (err) {
    next(err);
  }
});

router.get('/books', async (_req, res, next) => {
  try {
    const books = await listBooks();
    res.json({ books: books.map((b) => publicBook(b)) });
  } catch (err) {
    next(err);
  }
});

router.post('/books', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'PDF file is required' });
    }
    const title = String(req.body.title || '').trim();
    const author = String(req.body.author || '').trim();
    if (!title || !author) {
      return res.status(400).json({ error: 'Title and author are required' });
    }
    const result = await uploadAndEncryptBook({
      buffer: req.file.buffer,
      originalFileName: req.file.originalname,
      title,
      author,
      category: String(req.body.category || 'General').trim(),
      description: String(req.body.description || '').trim(),
      publicationInfo: String(req.body.publicationInfo || '').trim(),
      uploadedBy: req.user.id,
    });
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof multer.MulterError) {
      err.status = 400;
    }
    next(err);
  }
});

router.get('/books/:id/encryption', async (req, res, next) => {
  try {
    const book = await getBookInternal(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    const preview = await ciphertextPreview(book.id, 48);
    const perms = (await listAllPermissions()).filter((p) => p.bookId === book.id);
    res.json({
      book: encryptionDetail(book),
      ciphertext: preview,
      permissions: perms,
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/books/:id', async (req, res, next) => {
  try {
    const book = await updateBook(req.params.id, req.body);
    res.json({ book });
  } catch (err) {
    next(err);
  }
});

router.delete('/books/:id', async (req, res, next) => {
  try {
    await deleteBook(req.params.id, req.user.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

const studentSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  studentId: z.string().min(1),
  password: z.string().min(8),
});

router.get('/students', async (_req, res, next) => {
  try {
    const users = await listUsers();
    res.json({
      students: users.filter((u) => u.role === 'student').map(sanitizeUserSafe),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/students', validateBody(studentSchema), async (req, res, next) => {
  try {
    const user = await createUser({
      ...req.body,
      role: 'student',
    });
    res.status(201).json({ student: user });
  } catch (err) {
    next(err);
  }
});

router.patch('/students/:id', async (req, res, next) => {
  try {
    const { password, ...rest } = req.body;
    let user = await updateUser(req.params.id, rest);
    if (password) {
      user = await setUserPassword(req.params.id, password);
    }
    res.json({ student: user });
  } catch (err) {
    next(err);
  }
});

router.get('/permissions', async (_req, res, next) => {
  try {
    res.json({ permissions: await listAllPermissions() });
  } catch (err) {
    next(err);
  }
});

const grantSchema = z.object({
  userId: z.string().uuid(),
  bookId: z.string().uuid(),
  expiresAt: z.string().datetime().nullable().optional(),
});

router.post('/permissions', validateBody(grantSchema), async (req, res, next) => {
  try {
    const permission = await grantPermission({
      userId: req.body.userId,
      bookId: req.body.bookId,
      grantedBy: req.user.id,
      expiresAt: req.body.expiresAt ?? null,
    });
    res.status(201).json({ permission });
  } catch (err) {
    next(err);
  }
});

router.post('/permissions/:id/revoke', async (req, res, next) => {
  try {
    const permission = await revokePermission(req.params.id, req.user.id);
    res.json({ permission });
  } catch (err) {
    next(err);
  }
});

router.get('/audit-logs', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    res.json({ logs: await getAuditLogs(limit) });
  } catch (err) {
    next(err);
  }
});

export default router;
