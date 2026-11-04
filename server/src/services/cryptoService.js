import crypto from 'crypto';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { config } from '../config.js';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;

export function sha256Hex(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function generateDocumentKey() {
  return crypto.randomBytes(32);
}

export function encryptBuffer(plaintext, key) {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { ciphertext: encrypted, iv, authTag };
}

export function decryptBuffer(ciphertext, key, iv, authTag) {
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export function wrapDocumentKey(documentKey) {
  const { ciphertext, iv, authTag } = encryptBuffer(documentKey, config.masterKey);
  return {
    wrappedKey: ciphertext.toString('base64'),
    wrapIv: iv.toString('base64'),
    wrapTag: authTag.toString('base64'),
    alg: 'AES-256-GCM',
  };
}

export function unwrapDocumentKey({ wrappedKey, wrapIv, wrapTag }) {
  return decryptBuffer(
    Buffer.from(wrappedKey, 'base64'),
    config.masterKey,
    Buffer.from(wrapIv, 'base64'),
    Buffer.from(wrapTag, 'base64')
  );
}

export function encryptedFilePath(bookId) {
  const primary = path.join(config.encryptedDir, `${bookId}.pdf.enc`);
  if (existsSync(primary)) return primary;
  const legacy = path.join(config.legacyEncryptedDir, `${bookId}.pdf.enc`);
  if (existsSync(legacy)) return legacy;
  return primary;
}

export function keyFilePath(bookId) {
  const primary = path.join(config.keysDir, `${bookId}.key.json`);
  if (existsSync(primary)) return primary;
  const legacy = path.join(config.legacyKeysDir, `${bookId}.key.json`);
  if (existsSync(legacy)) return legacy;
  return primary;
}

export async function persistWrappedKey(bookId, wrapMeta) {
  await fs.mkdir(config.keysDir, { recursive: true });
  const file = path.join(config.keysDir, `${bookId}.key.json`);
  const tmp = `${file}.${process.pid}.tmp`;
  const payload = JSON.stringify({ bookId, ...wrapMeta }, null, 2);
  await fs.writeFile(tmp, payload, 'utf8');
  await fs.rename(tmp, file);
}

export async function loadWrappedKey(bookId) {
  const raw = await fs.readFile(keyFilePath(bookId), 'utf8');
  return JSON.parse(raw);
}

export async function persistCiphertext(bookId, ciphertext) {
  await fs.mkdir(config.encryptedDir, { recursive: true });
  const file = path.join(config.encryptedDir, `${bookId}.pdf.enc`);
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, ciphertext);
  await fs.rename(tmp, file);
}

export async function loadCiphertext(bookId) {
  return fs.readFile(encryptedFilePath(bookId));
}

export async function removeBookArtifacts(bookId) {
  await Promise.allSettled([
    fs.unlink(path.join(config.encryptedDir, `${bookId}.pdf.enc`)),
    fs.unlink(path.join(config.legacyEncryptedDir, `${bookId}.pdf.enc`)),
    fs.unlink(path.join(config.keysDir, `${bookId}.key.json`)),
    fs.unlink(path.join(config.legacyKeysDir, `${bookId}.key.json`)),
  ]);
}

/**
 * Full encrypt pipeline. Returns safe metadata + step timeline (never raw DEK).
 */
export async function encryptAndStorePdf(bookId, pdfBuffer) {
  const steps = [];
  const push = (id, label, status, detail = {}) => {
    steps.push({
      id,
      label,
      status,
      at: new Date().toISOString(),
      ...detail,
    });
  };

  push('validate', 'Validating PDF', 'completed', {
    fileSize: pdfBuffer.length,
    magic: pdfBuffer.subarray(0, 5).toString('utf8'),
  });

  const documentKey = generateDocumentKey();
  const keyId = `DEK-${bookId.slice(0, 8)}`;
  const keyFingerprint = sha256Hex(documentKey).slice(0, 16);
  push('keygen', 'Generating 256-bit document key', 'completed', {
    algorithm: 'AES-256-GCM',
    keyBits: 256,
    keyId,
    keyFingerprint,
    note: 'Raw key never returned to clients',
  });

  const { ciphertext, iv, authTag } = encryptBuffer(pdfBuffer, documentKey);
  push('encrypt', 'Encrypting PDF with AES-256-GCM', 'completed', {
    algorithm: 'AES-256-GCM',
    plaintextBytes: pdfBuffer.length,
    ciphertextBytes: ciphertext.length,
    ivLength: iv.length,
    authTagLength: authTag.length,
  });

  const wrapMeta = wrapDocumentKey(documentKey);
  documentKey.fill(0);
  push('wrap', 'Protecting document key with master key', 'completed', {
    wrapAlgorithm: 'AES-256-GCM',
    storage: 'protected-keys/',
  });

  const sha256 = sha256Hex(pdfBuffer);
  push('integrity', 'Calculating SHA-256 integrity hash', 'completed', {
    sha256,
    authTag: authTag.toString('base64'),
  });

  await persistCiphertext(bookId, ciphertext);
  await persistWrappedKey(bookId, wrapMeta);
  push('store', 'Saving encrypted asset to secure storage', 'completed', {
    encryptedFile: `${bookId}.pdf.enc`,
    directory: 'encrypted-books/',
  });

  return {
    encryptedFile: `${bookId}.pdf.enc`,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    sha256,
    sizeBytes: pdfBuffer.length,
    ciphertextBytes: ciphertext.length,
    keyId,
    keyFingerprint,
    algorithm: 'AES-256-GCM',
    steps,
  };
}

export async function decryptStoredPdf(bookId, ivB64, authTagB64) {
  const wrapMeta = await loadWrappedKey(bookId);
  const documentKey = unwrapDocumentKey(wrapMeta);
  try {
    const ciphertext = await loadCiphertext(bookId);
    return decryptBuffer(
      ciphertext,
      documentKey,
      Buffer.from(ivB64, 'base64'),
      Buffer.from(authTagB64, 'base64')
    );
  } finally {
    documentKey.fill(0);
  }
}

export function isPdfBuffer(buffer) {
  if (!buffer || buffer.length < 5) return false;
  return buffer.subarray(0, 5).toString('utf8') === '%PDF-';
}

/** Safe hex preview of ciphertext for lab demos (not decryptable). */
export async function ciphertextPreview(bookId, bytes = 64) {
  const buf = await loadCiphertext(bookId);
  return {
    size: buf.length,
    hexPreview: buf.subarray(0, bytes).toString('hex'),
    startsWithPdfMagic: buf.subarray(0, 5).toString('utf8') === '%PDF-',
    asciiReadable: /%PDF-|BT |\/Type/.test(buf.subarray(0, 256).toString('latin1')),
  };
}
