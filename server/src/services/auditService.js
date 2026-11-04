import { v4 as uuidv4 } from 'uuid';
import { paths, config } from '../config.js';
import { readJson, updateJson, validateArrayField } from './jsonStore.js';

const DEFAULT = { logs: [] };

export async function getAuditLogs(limit = 100) {
  const data = validateArrayField(await readJson(paths.auditLogs, DEFAULT), 'logs');
  return data.logs.slice(0, limit);
}

export async function appendAudit(entry) {
  const record = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    ...entry,
  };

  await updateJson(paths.auditLogs, DEFAULT, (data) => {
    const safe = validateArrayField(data, 'logs');
    safe.logs.unshift(record);
    if (safe.logs.length > config.auditLogCap) {
      safe.logs = safe.logs.slice(0, config.auditLogCap);
    }
    return safe;
  });

  return record;
}

export async function countAuditByType(typePrefix) {
  const data = validateArrayField(await readJson(paths.auditLogs, DEFAULT), 'logs');
  return data.logs.filter((l) => String(l.type || '').startsWith(typePrefix)).length;
}

export async function countUnauthorizedAttempts() {
  const data = validateArrayField(await readJson(paths.auditLogs, DEFAULT), 'logs');
  return data.logs.filter((l) =>
    [
      'ACCESS_DENIED',
      'UNAUTHORIZED_ACCESS',
      'LOGIN_FAILED',
      'TAMPER_DETECTED',
      'INTEGRITY_VERIFICATION_FAILED',
      'UNAUTHORIZED',
    ].includes(l.type)
  ).length;
}
