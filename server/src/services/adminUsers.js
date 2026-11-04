export {
  listUsers,
  createUser,
  updateUser,
  setUserPassword,
} from './authService.js';

export function sanitizeUserSafe(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}
