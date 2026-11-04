import { v4 as uuidv4 } from 'uuid';
import { paths } from '../config.js';
import { readJson, updateJson, validateArrayField } from './jsonStore.js';
import {
  encryptAndStorePdf,
  removeBookArtifacts,
  isPdfBuffer,
  decryptStoredPdf,
} from './cryptoService.js';
import { appendAudit } from './auditService.js';
import { listPermissions } from './permissionService.js';

const DEFAULT = { books: [] };
const HISTORY_DEFAULT = { history: [] };

const COVER_COLORS = ['#1e4d8c', '#0b5fff', '#2563eb', '#0ea5e9', '#0369a1', '#1d4ed8'];

export function publicBook(book, extras = {}) {
  if (!book) return null;
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    category: book.category,
    description: book.description,
    coverColor: book.coverColor,
    originalFileName: book.originalFileName,
    sizeBytes: book.sizeBytes,
    ciphertextBytes: book.ciphertextBytes || null,
    sha256: book.sha256,
    algorithm: book.algorithm || 'AES-256-GCM',
    encryptionStatus: book.status === 'active' ? 'encrypted' : book.status,
    keyId: book.keyId || null,
    keyFingerprint: book.keyFingerprint || null,
    publicationInfo: book.publicationInfo || '',
    uploadedBy: book.uploadedBy,
    createdAt: book.createdAt,
    status: book.status,
    ...extras,
  };
}

/** Admin encryption-center detail (still no raw keys / paths beyond ids). */
export function encryptionDetail(book) {
  if (!book) return null;
  return {
    ...publicBook(book),
    encryptedAssetId: book.encryptedFile,
    ivLength: book.iv ? Buffer.from(book.iv, 'base64').length : 12,
    authTagPresent: Boolean(book.authTag),
    storageVault: 'encrypted-books/',
    keyVault: 'protected-keys/',
  };
}

export async function listBooks() {
  const data = validateArrayField(await readJson(paths.books, DEFAULT), 'books');
  return data.books.filter((b) => b.status !== 'deleted');
}

export async function getBookById(id) {
  const books = await listBooks();
  return books.find((b) => b.id === id) || null;
}

export async function getBookInternal(id) {
  const data = validateArrayField(await readJson(paths.books, DEFAULT), 'books');
  return data.books.find((b) => b.id === id && b.status !== 'deleted') || null;
}

export async function uploadAndEncryptBook({
  buffer,
  originalFileName,
  title,
  author,
  category,
  description,
  publicationInfo = '',
  uploadedBy,
}) {
  if (!isPdfBuffer(buffer)) {
    const err = new Error('Uploaded file is not a valid PDF');
    err.status = 400;
    throw err;
  }

  const id = uuidv4();
  const enc = await encryptAndStorePdf(id, buffer);

  const book = {
    id,
    title,
    author,
    category: category || 'General',
    description: description || '',
    publicationInfo: publicationInfo || '',
    coverColor: COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)],
    originalFileName,
    mimeType: 'application/pdf',
    sizeBytes: enc.sizeBytes,
    ciphertextBytes: enc.ciphertextBytes,
    sha256: enc.sha256,
    encryptedFile: enc.encryptedFile,
    iv: enc.iv,
    authTag: enc.authTag,
    algorithm: enc.algorithm,
    keyId: enc.keyId,
    keyFingerprint: enc.keyFingerprint,
    uploadedBy,
    createdAt: new Date().toISOString(),
    status: 'active',
  };

  await updateJson(paths.books, DEFAULT, (data) => {
    const safe = validateArrayField(data, 'books');
    safe.books.push(book);
    return safe;
  });

  await appendAudit({
    type: 'PDF_UPLOADED',
    actorId: uploadedBy,
    bookId: id,
    message: `Uploaded PDF: ${title}`,
    sha256: enc.sha256,
  });
  await appendAudit({
    type: 'DOCUMENT_ENCRYPTED',
    actorId: uploadedBy,
    bookId: id,
    message: `AES-256-GCM encryption completed for ${title}`,
    sha256: enc.sha256,
    keyFingerprint: enc.keyFingerprint,
  });

  return {
    book: encryptionDetail(book),
    pipeline: enc.steps,
  };
}

export async function updateBook(id, patch) {
  let updated = null;
  await updateJson(paths.books, DEFAULT, (data) => {
    const safe = validateArrayField(data, 'books');
    const idx = safe.books.findIndex((b) => b.id === id);
    if (idx === -1) return safe;
    const book = safe.books[idx];
    for (const key of ['title', 'author', 'category', 'description', 'status']) {
      if (patch[key] !== undefined) book[key] = patch[key];
    }
    safe.books[idx] = book;
    updated = book;
    return safe;
  });
  if (!updated) {
    const err = new Error('Book not found');
    err.status = 404;
    throw err;
  }
  return publicBook(updated);
}

export async function deleteBook(id, actorId) {
  const book = await getBookInternal(id);
  if (!book) {
    const err = new Error('Book not found');
    err.status = 404;
    throw err;
  }

  await updateJson(paths.books, DEFAULT, (data) => {
    const safe = validateArrayField(data, 'books');
    const idx = safe.books.findIndex((b) => b.id === id);
    if (idx !== -1) safe.books[idx].status = 'deleted';
    return safe;
  });

  await removeBookArtifacts(id);

  await appendAudit({
    type: 'ADMIN_BOOK_DELETE',
    actorId,
    bookId: id,
    message: `Deleted book ${book.title}`,
  });

  return true;
}

export async function decryptBookContent(book) {
  try {
    return await decryptStoredPdf(book.id, book.iv, book.authTag);
  } catch (err) {
    if (err.message?.includes('Unsupported state') || err.message?.includes('auth') || err.code === 'ERR_CRYPTO_INVALID_AUTH_TAG') {
      const tamper = new Error('Encrypted document integrity check failed (possible tampering)');
      tamper.status = 403;
      tamper.code = 'TAMPER_DETECTED';
      throw tamper;
    }
    throw err;
  }
}

export async function searchBooks(query, allowedBookIds = null) {
  const q = String(query || '').trim().toLowerCase();
  let books = await listBooks();
  if (allowedBookIds) {
    const set = new Set(allowedBookIds);
    books = books.filter((b) => set.has(b.id));
  }
  if (!q) return books.map((b) => publicBook(b));
  return books
    .filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        (b.description || '').toLowerCase().includes(q)
    )
    .map((b) => publicBook(b));
}

export async function getBooksForStudent(userId) {
  const perms = await listPermissions();
  const allowed = new Set(
    perms.filter((p) => p.userId === userId && p.status === 'active').map((p) => p.bookId)
  );
  const books = await listBooks();
  return books.filter((b) => allowed.has(b.id)).map((b) => publicBook(b, { hasAccess: true }));
}

export async function recordReadingEvent({ userId, bookId }) {
  const entry = {
    id: uuidv4(),
    userId,
    bookId,
    accessedAt: new Date().toISOString(),
  };
  await updateJson(paths.readingHistory, HISTORY_DEFAULT, (data) => {
    const safe = validateArrayField(data, 'history');
    safe.history.unshift(entry);
    if (safe.history.length > 2000) safe.history = safe.history.slice(0, 2000);
    return safe;
  });
  return entry;
}

export async function getReadingHistory(userId, limit = 50) {
  const data = validateArrayField(
    await readJson(paths.readingHistory, HISTORY_DEFAULT),
    'history'
  );
  const books = await listBooks();
  const bookMap = new Map(books.map((b) => [b.id, b]));
  return data.history
    .filter((h) => h.userId === userId)
    .slice(0, limit)
    .map((h) => ({
      ...h,
      book: publicBook(bookMap.get(h.bookId)),
    }));
}

export async function countReadingSessions() {
  const data = validateArrayField(
    await readJson(paths.readingHistory, HISTORY_DEFAULT),
    'history'
  );
  return data.history.length;
}

export async function getReadingHistoryAll(limit = 500) {
  const data = validateArrayField(
    await readJson(paths.readingHistory, HISTORY_DEFAULT),
    'history'
  );
  return data.history.slice(0, limit);
}
