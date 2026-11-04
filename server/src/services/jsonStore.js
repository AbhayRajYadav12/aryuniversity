import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

/** @type {Map<string, Promise<void>>} */
const locks = new Map();

async function withLock(filePath, fn) {
  const prev = locks.get(filePath) || Promise.resolve();
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const chain = prev.then(() => gate);
  locks.set(filePath, chain);

  await prev;
  try {
    return await fn();
  } finally {
    release();
    if (locks.get(filePath) === chain) {
      locks.delete(filePath);
    }
  }
}

async function ensureParentDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

/**
 * Atomically write JSON: write temp file then rename.
 */
async function atomicWrite(filePath, data) {
  await ensureParentDir(filePath);
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  const payload = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(tmp, payload, 'utf8');
  await fs.rename(tmp, filePath);
}

/**
 * Read JSON file with defaults for missing/corrupt files.
 */
export async function readJson(filePath, defaultValue) {
  return withLock(filePath, async () => {
    if (!existsSync(filePath)) {
      await atomicWrite(filePath, defaultValue);
      return structuredClone(defaultValue);
    }
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      if (!raw.trim()) {
        await atomicWrite(filePath, defaultValue);
        return structuredClone(defaultValue);
      }
      const parsed = JSON.parse(raw);
      if (parsed === null || typeof parsed !== 'object') {
        throw new Error('JSON root must be an object');
      }
      return parsed;
    } catch (err) {
      const backup = `${filePath}.corrupt.${Date.now()}.bak`;
      try {
        await fs.copyFile(filePath, backup);
      } catch {
        /* ignore */
      }
      await atomicWrite(filePath, defaultValue);
      console.warn(`[jsonStore] Corrupted ${filePath}; reset. Backup: ${backup}. Reason: ${err.message}`);
      return structuredClone(defaultValue);
    }
  });
}

/**
 * Write JSON atomically under mutex.
 */
export async function writeJson(filePath, data) {
  return withLock(filePath, async () => {
    await atomicWrite(filePath, data);
  });
}

/**
 * Read-modify-write under a single lock.
 */
export async function updateJson(filePath, defaultValue, updater) {
  return withLock(filePath, async () => {
    let current;
    if (!existsSync(filePath)) {
      current = structuredClone(defaultValue);
    } else {
      try {
        const raw = await fs.readFile(filePath, 'utf8');
        current = raw.trim() ? JSON.parse(raw) : structuredClone(defaultValue);
        if (current === null || typeof current !== 'object') {
          current = structuredClone(defaultValue);
        }
      } catch {
        current = structuredClone(defaultValue);
      }
    }
    const next = await updater(current);
    await atomicWrite(filePath, next);
    return next;
  });
}

export function validateArrayField(obj, field) {
  if (!obj || typeof obj !== 'object' || !Array.isArray(obj[field])) {
    return { [field]: [] };
  }
  return obj;
}
