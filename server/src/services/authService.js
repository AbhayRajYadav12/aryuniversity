import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config, paths } from '../config.js';
import { readJson, updateJson, validateArrayField } from './jsonStore.js';
import { hashPassword, verifyPassword, sanitizeUser } from '../utils/hash.js';
import { appendAudit } from './auditService.js';

const DEFAULT_USERS = { users: [] };

export async function listUsers() {
  const data = validateArrayField(await readJson(paths.users, DEFAULT_USERS), 'users');
  return data.users;
}

export async function findUserByEmail(email) {
  const users = await listUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function findUserById(id) {
  const users = await listUsers();
  return users.find((u) => u.id === id) || null;
}

export async function createUser({ email, name, password, role, studentId = null }) {
  const existing = await findUserByEmail(email);
  if (existing) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }

  const user = {
    id: uuidv4(),
    email: email.toLowerCase(),
    name,
    studentId,
    role,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
    active: true,
  };

  await updateJson(paths.users, DEFAULT_USERS, (data) => {
    const safe = validateArrayField(data, 'users');
    safe.users.push(user);
    return safe;
  });

  await appendAudit({
    type: 'ADMIN_USER_CREATE',
    actorId: null,
    targetUserId: user.id,
    message: `Created ${role} ${email}`,
  });

  return sanitizeUser(user);
}

export async function updateUser(id, patch) {
  let updated = null;
  await updateJson(paths.users, DEFAULT_USERS, (data) => {
    const safe = validateArrayField(data, 'users');
    const idx = safe.users.findIndex((u) => u.id === id);
    if (idx === -1) return safe;
    const user = safe.users[idx];
    if (patch.name !== undefined) user.name = patch.name;
    if (patch.studentId !== undefined) user.studentId = patch.studentId;
    if (patch.active !== undefined) user.active = patch.active;
    if (patch.password) {
      // handled async outside — caller should pass passwordHash
    }
    safe.users[idx] = user;
    updated = user;
    return safe;
  });
  if (!updated) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return sanitizeUser(updated);
}

export async function setUserPassword(id, password) {
  const passwordHash = await hashPassword(password);
  let updated = null;
  await updateJson(paths.users, DEFAULT_USERS, (data) => {
    const safe = validateArrayField(data, 'users');
    const idx = safe.users.findIndex((u) => u.id === id);
    if (idx === -1) return safe;
    safe.users[idx].passwordHash = passwordHash;
    updated = safe.users[idx];
    return safe;
  });
  if (!updated) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return sanitizeUser(updated);
}

export async function authenticate(email, password, meta = {}) {
  const user = await findUserByEmail(email);
  if (!user || !user.active) {
    await appendAudit({
      type: 'LOGIN_FAILED',
      email,
      ip: meta.ip,
      message: 'Invalid credentials or inactive account',
    });
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) {
    await appendAudit({
      type: 'LOGIN_FAILED',
      email,
      userId: user.id,
      ip: meta.ip,
      message: 'Bad password',
    });
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  await appendAudit({
    type: 'USER_LOGIN',
    userId: user.id,
    role: user.role,
    ip: meta.ip,
    message: `Login by ${user.email}`,
  });

  return { token, user: sanitizeUser(user) };
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

/** Create an already-expired token for security demos */
export function createExpiredToken(payload) {
  return jwt.sign(
    { ...payload, exp: Math.floor(Date.now() / 1000) - 60 },
    config.jwtSecret
  );
}
