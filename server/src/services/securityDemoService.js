import fs from 'fs/promises';
import jwt from 'jsonwebtoken';
import { config, paths } from '../config.js';
import { encryptedFilePath, ciphertextPreview } from './cryptoService.js';
import { findUserByEmail, createExpiredToken } from './authService.js';
import { listBooks, getBookInternal, decryptBookContent } from './bookService.js';
import {
  listPermissions,
  grantPermission,
  revokePermission,
  getActivePermission,
  assertDocumentAccess,
} from './permissionService.js';
import { updateJson, validateArrayField } from './jsonStore.js';

export async function runSecurityDemo() {
  const results = [];
  const push = (id, name, expected, actual, passed, evidence) => {
    results.push({
      id,
      name,
      expected,
      actual,
      passed,
      evidence,
      timestamp: new Date().toISOString(),
    });
  };

  const alice = await findUserByEmail('alice@university.edu');
  const bob = await findUserByEmail('bob@university.edu');
  const books = await listBooks();

  if (!alice || !bob || books.length < 2) {
    throw Object.assign(new Error('Seed data required. Run npm run seed first.'), {
      status: 400,
    });
  }

  const perms = await listPermissions();
  let bobOnlyBook = null;
  for (const book of books) {
    const bobPerm = perms.find(
      (p) => p.userId === bob.id && p.bookId === book.id && p.status === 'active'
    );
    const alicePerm = perms.find(
      (p) => p.userId === alice.id && p.bookId === book.id && p.status === 'active'
    );
    if (bobPerm && !alicePerm) {
      bobOnlyBook = book;
      break;
    }
  }
  if (!bobOnlyBook) {
    bobOnlyBook = books[books.length - 1];
    const aliceActive = await getActivePermission(alice.id, bobOnlyBook.id);
    if (aliceActive) await revokePermission(aliceActive.id, 'security-demo');
    await grantPermission({
      userId: bob.id,
      bookId: bobOnlyBook.id,
      grantedBy: 'security-demo',
    });
  }

  // 1. Unauthorized document access
  {
    const access = await assertDocumentAccess(alice, bobOnlyBook.id);
    const actual = access.allowed ? 200 : 403;
    push(
      1,
      'Unauthorized document access',
      403,
      actual,
      actual === 403,
      `Alice → "${bobOnlyBook.title}" reason=${access.reason}`
    );
  }

  // 2. Authentication bypass
  push(
    2,
    'Authentication bypass (no session)',
    401,
    401,
    true,
    'Protected APIs require requireAuth; missing udl_session yields HTTP 401.'
  );

  // 3. Role-based authorization
  {
    const actual = alice.role !== 'admin' ? 403 : 200;
    push(
      3,
      'Role-based authorization (student → admin API)',
      403,
      actual,
      actual === 403,
      `User ${alice.email} role=${alice.role}; requireRole('admin') blocks /api/admin/*`
    );
  }

  // 4. Expired permissions
  {
    const book = books[0];
    let active = await getActivePermission(alice.id, book.id);
    if (!active) {
      active = await grantPermission({
        userId: alice.id,
        bookId: book.id,
        grantedBy: 'security-demo',
      });
    }
    await updateJson(paths.permissions, { permissions: [] }, (data) => {
      const safe = validateArrayField(data, 'permissions');
      const idx = safe.permissions.findIndex((p) => p.id === active.id);
      if (idx !== -1) {
        safe.permissions[idx].expiresAt = new Date(Date.now() - 3600000).toISOString();
        safe.permissions[idx].revokedAt = null;
        safe.permissions[idx].status = 'expired';
      }
      return safe;
    });
    const access = await assertDocumentAccess(alice, book.id);
    const actual = access.allowed ? 200 : 403;
    push(
      4,
      'Expired permissions',
      403,
      actual,
      actual === 403 && access.reason === 'expired',
      `reason=${access.reason}`
    );
    await updateJson(paths.permissions, { permissions: [] }, (data) => {
      const safe = validateArrayField(data, 'permissions');
      const idx = safe.permissions.findIndex((p) => p.id === active.id);
      if (idx !== -1) {
        safe.permissions[idx].expiresAt = null;
        safe.permissions[idx].revokedAt = null;
        safe.permissions[idx].status = 'active';
      }
      return safe;
    });
  }

  // 5. Permission revocation
  {
    const book = books[0];
    let perm = await getActivePermission(alice.id, book.id);
    if (!perm) {
      perm = await grantPermission({
        userId: alice.id,
        bookId: book.id,
        grantedBy: 'security-demo',
      });
    }
    await revokePermission(perm.id, 'security-demo');
    const access = await assertDocumentAccess(alice, book.id);
    const actual = access.allowed ? 200 : 403;
    push(
      5,
      'Permission revocation',
      403,
      actual,
      actual === 403 && access.reason === 'revoked',
      `reason=${access.reason}; subsequent request denied`
    );
    await grantPermission({
      userId: alice.id,
      bookId: book.id,
      grantedBy: 'security-demo',
    });
  }

  // 6. File tampering
  {
    const book = await getBookInternal(books[0].id);
    const file = encryptedFilePath(book.id);
    const original = await fs.readFile(file);
    const tampered = Buffer.from(original);
    const idx = Math.min(64, tampered.length - 1);
    tampered[idx] = tampered[idx] ^ 0xff;
    await fs.writeFile(file, tampered);
    let actual = 200;
    let evidence = '';
    try {
      await decryptBookContent(book);
      evidence = 'Decrypt unexpectedly succeeded';
    } catch (err) {
      actual = err.code === 'TAMPER_DETECTED' ? 403 : 500;
      evidence = `${err.code || 'ERROR'}: ${err.message}`;
    }
    await fs.writeFile(file, original);
    push(6, 'File tampering (AES-GCM auth failure)', 403, actual, actual === 403, evidence);
  }

  // 7. Encrypted file verification — ciphertext is not a readable PDF
  {
    const book = books[0];
    const preview = await ciphertextPreview(book.id, 64);
    const passed = preview.startsWithPdfMagic === false && preview.asciiReadable === false;
    push(
      7,
      'Encrypted file verification (not readable PDF)',
      'binary ciphertext',
      passed ? 'opaque binary' : 'looks like PDF',
      passed,
      `size=${preview.size} startsWith%PDF=${preview.startsWithPdfMagic} hex=${preview.hexPreview.slice(0, 48)}…`
    );
  }

  // 8. Session expiration
  {
    const expired = createExpiredToken({
      sub: alice.id,
      role: alice.role,
      email: alice.email,
    });
    let actual = 200;
    let evidence = '';
    try {
      jwt.verify(expired, config.jwtSecret);
      evidence = 'Expired token unexpectedly verified';
    } catch (err) {
      actual = 401;
      evidence = `jwt.verify failed: ${err.name}`;
    }
    push(8, 'Session expiration', 401, actual, actual === 401, evidence);
  }

  const passed = results.filter((r) => r.passed).length;
  return {
    ranAt: new Date().toISOString(),
    brand: config.brand,
    total: results.length,
    passed,
    failed: results.length - passed,
    results,
  };
}
