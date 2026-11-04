import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  listBooks,
  getBookById,
  searchBooks,
  getBooksForStudent,
  getReadingHistory,
  publicBook,
} from '../services/bookService.js';
import { listPermissions } from '../services/permissionService.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      const books = await listBooks();
      return res.json({ books: books.map((b) => publicBook(b)) });
    }
    const books = await getBooksForStudent(req.user.id);
    res.json({ books });
  } catch (err) {
    next(err);
  }
});

router.get('/catalog', requireRole('student', 'admin'), async (req, res, next) => {
  try {
    const books = await listBooks();
    if (req.user.role === 'admin') {
      return res.json({ books: books.map((b) => publicBook(b, { hasAccess: true })) });
    }
    const perms = await listPermissions();
    const allowed = new Set(
      perms
        .filter((p) => p.userId === req.user.id && p.status === 'active')
        .map((p) => p.bookId)
    );
    res.json({
      books: books.map((b) =>
        publicBook(b, {
          hasAccess: allowed.has(b.id),
        })
      ),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/search', async (req, res, next) => {
  try {
    const q = req.query.q || '';
    if (req.user.role === 'admin') {
      const books = await searchBooks(q);
      return res.json({ books });
    }
    const mine = await getBooksForStudent(req.user.id);
    const ids = mine.map((b) => b.id);
    const books = await searchBooks(q, ids);
    res.json({ books });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const book = await getBookById(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    if (req.user.role === 'admin') {
      return res.json({ book: publicBook(book, { hasAccess: true }) });
    }

    const perms = await listPermissions();
    const hasAccess = perms.some(
      (p) =>
        p.userId === req.user.id &&
        p.bookId === book.id &&
        p.status === 'active'
    );
    res.json({ book: publicBook(book, { hasAccess }) });
  } catch (err) {
    next(err);
  }
});

export default router;
