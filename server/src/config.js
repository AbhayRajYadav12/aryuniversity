import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, '.env') });

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const masterKeyHex = requireEnv('MASTER_KEY');
if (!/^[0-9a-fA-F]{64}$/.test(masterKeyHex)) {
  throw new Error('MASTER_KEY must be 64 hex characters (32 bytes)');
}

export const config = {
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  nodeEnv: process.env.NODE_ENV || 'development',
  masterKey: Buffer.from(masterKeyHex, 'hex'),
  dataDir: path.join(rootDir, 'data'),
  // Prefer ARY folder names; fall back handled at runtime if legacy dirs exist
  encryptedDir: path.join(rootDir, 'data', 'encrypted-books'),
  keysDir: path.join(rootDir, 'data', 'protected-keys'),
  tempDir: path.join(rootDir, 'data', 'temporary-processing'),
  legacyEncryptedDir: path.join(rootDir, 'data', 'encrypted'),
  legacyKeysDir: path.join(rootDir, 'data', 'keys'),
  maxUploadBytes: 25 * 1024 * 1024,
  auditLogCap: 5000,
  cookieName: 'udl_session',
  csrfCookieName: 'udl_csrf',
  brand: 'ARY University Secure Digital Library',
};

export const paths = {
  users: path.join(config.dataDir, 'users.json'),
  books: path.join(config.dataDir, 'books.json'),
  permissions: path.join(config.dataDir, 'permissions.json'),
  auditLogs: path.join(config.dataDir, 'audit-logs.json'),
  readingHistory: path.join(config.dataDir, 'reading-history.json'),
};
