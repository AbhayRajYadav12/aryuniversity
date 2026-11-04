import { listUsers } from './authService.js';
import { listBooks, countReadingSessions, getReadingHistoryAll } from './bookService.js';
import { countActivePermissions, listPermissions } from './permissionService.js';
import { getAuditLogs, countUnauthorizedAttempts } from './auditService.js';

function dayKey(iso) {
  return String(iso || '').slice(0, 10);
}

function lastNDays(n) {
  const days = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export async function getAdminStats() {
  const [users, books, activePermissions, readingSessions, unauthorized, recent, permissions, logs, history] =
    await Promise.all([
      listUsers(),
      listBooks(),
      countActivePermissions(),
      countReadingSessions(),
      countUnauthorizedAttempts(),
      getAuditLogs(20),
      listPermissions(),
      getAuditLogs(500),
      getReadingHistoryAll(500),
    ]);

  const students = users.filter((u) => u.role === 'student');
  const days = lastNDays(7);

  const accessByDay = days.map((day) => ({
    day,
    access: history.filter((h) => dayKey(h.accessedAt) === day).length,
    denied: logs.filter(
      (l) => dayKey(l.timestamp) === day && ['ACCESS_DENIED', 'UNAUTHORIZED_ACCESS'].includes(l.type)
    ).length,
  }));

  const encryptionByDay = days.map((day) => ({
    day,
    encrypted: logs.filter(
      (l) => dayKey(l.timestamp) === day && ['DOCUMENT_ENCRYPTED', 'UPLOAD', 'PDF_UPLOADED'].includes(l.type)
    ).length,
  }));

  const categoryMap = {};
  for (const b of books) {
    categoryMap[b.category || 'General'] = (categoryMap[b.category || 'General'] || 0) + 1;
  }
  const categories = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  const securityEvents = {
    totalAccessAttempts:
      logs.filter((l) =>
        ['DECRYPT_OK', 'DOCUMENT_ACCESSED', 'ACCESS_DENIED', 'UNAUTHORIZED_ACCESS'].includes(l.type)
      ).length,
    successfulAccess: logs.filter((l) => ['DECRYPT_OK', 'DOCUMENT_ACCESSED'].includes(l.type)).length,
    blockedUnauthorized: unauthorized,
    expiredAttempts: logs.filter((l) => l.reason === 'expired' || /expired/i.test(l.message || '')).length,
    revokedAttempts: logs.filter((l) => l.reason === 'revoked' || /revoked/i.test(l.message || '')).length,
    integrityFailures: logs.filter((l) =>
      ['TAMPER_DETECTED', 'INTEGRITY_VERIFICATION_FAILED'].includes(l.type)
    ).length,
    loginFailures: logs.filter((l) => l.type === 'LOGIN_FAILED').length,
  };

  return {
    totalBooks: books.length,
    totalStudents: students.length,
    encryptedDocuments: books.length,
    activePermissions,
    totalReadingSessions: readingSessions,
    unauthorizedAccessAttempts: unauthorized,
    totalPermissions: permissions.length,
    recentActivities: recent,
    charts: {
      accessByDay,
      encryptionByDay,
      categories,
    },
    securityEvents,
  };
}
