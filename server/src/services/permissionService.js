import { v4 as uuidv4 } from 'uuid';
import { paths } from '../config.js';
import { readJson, updateJson, validateArrayField } from './jsonStore.js';
import { appendAudit } from './auditService.js';

const DEFAULT = { permissions: [] };

function computeStatus(perm) {
  if (perm.revokedAt) return 'revoked';
  if (perm.expiresAt && new Date(perm.expiresAt).getTime() < Date.now()) return 'expired';
  return 'active';
}

export function normalizePermission(perm) {
  return { ...perm, status: computeStatus(perm) };
}

export async function listPermissions() {
  const data = validateArrayField(await readJson(paths.permissions, DEFAULT), 'permissions');
  return data.permissions.map(normalizePermission);
}

export async function getPermissionById(id) {
  const all = await listPermissions();
  return all.find((p) => p.id === id) || null;
}

export async function getActivePermission(userId, bookId) {
  const all = await listPermissions();
  return (
    all.find(
      (p) =>
        p.userId === userId &&
        p.bookId === bookId &&
        computeStatus(p) === 'active'
    ) || null
  );
}

export async function grantPermission({ userId, bookId, grantedBy, expiresAt = null }) {
  const existing = await getActivePermission(userId, bookId);
  if (existing) {
    return existing;
  }

  const perm = {
    id: uuidv4(),
    userId,
    bookId,
    grantedBy,
    grantedAt: new Date().toISOString(),
    expiresAt,
    revokedAt: null,
    status: 'active',
  };

  await updateJson(paths.permissions, DEFAULT, (data) => {
    const safe = validateArrayField(data, 'permissions');
    safe.permissions.push(perm);
    return safe;
  });

  await appendAudit({
    type: 'PERMISSION_GRANTED',
    actorId: grantedBy,
    userId,
    bookId,
    permissionId: perm.id,
    message: `Granted access to book ${bookId}`,
  });

  return normalizePermission(perm);
}

export async function revokePermission(permissionId, actorId) {
  let revoked = null;
  await updateJson(paths.permissions, DEFAULT, (data) => {
    const safe = validateArrayField(data, 'permissions');
    const idx = safe.permissions.findIndex((p) => p.id === permissionId);
    if (idx === -1) return safe;
    safe.permissions[idx].revokedAt = new Date().toISOString();
    safe.permissions[idx].status = 'revoked';
    revoked = safe.permissions[idx];
    return safe;
  });

  if (!revoked) {
    const err = new Error('Permission not found');
    err.status = 404;
    throw err;
  }

  await appendAudit({
    type: 'PERMISSION_REVOKED',
    actorId,
    userId: revoked.userId,
    bookId: revoked.bookId,
    permissionId,
    message: `Revoked access to book ${revoked.bookId}`,
  });

  return normalizePermission(revoked);
}

export async function countActivePermissions() {
  const all = await listPermissions();
  return all.filter((p) => p.status === 'active').length;
}

/**
 * Check access for a user to a book. Admins always allowed.
 */
export async function assertDocumentAccess(user, bookId) {
  if (user.role === 'admin') {
    return { allowed: true, reason: 'admin' };
  }

  const perm = await getActivePermission(user.id, bookId);
  if (perm) {
    return { allowed: true, reason: 'granted', permission: perm };
  }

  const all = await listPermissions();
  const related = all.filter((p) => p.userId === user.id && p.bookId === bookId);
  if (!related.length) {
    return { allowed: false, reason: 'no_permission' };
  }
  // Prefer specific denial reasons when no active grant remains
  if (related.some((p) => p.status === 'expired')) {
    return { allowed: false, reason: 'expired' };
  }
  if (related.some((p) => p.status === 'revoked')) {
    return { allowed: false, reason: 'revoked' };
  }
  return { allowed: false, reason: 'no_permission' };
}
