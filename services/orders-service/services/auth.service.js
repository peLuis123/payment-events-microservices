const crypto = require('node:crypto');
const { promisify } = require('node:util');

const scrypt = promisify(crypto.scrypt);

function createAuthService({
  saveUser = async (user) => user,
  getUserByEmail = async () => undefined,
  saveRefreshToken = async () => undefined,
  getRefreshToken = async () => undefined,
  deleteRefreshToken = async () => undefined,
  getUser = async () => undefined,
  createUserId = () => crypto.randomUUID(),
  signToken = (payload) => signTokenValue(payload, process.env.AUTH_TOKEN_SECRET || 'development-only-secret'),
  verifyPassword: verifyPasswordDependency
} = {}) {
  async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = await scrypt(password, salt, 64);
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  async function verifyPassword(password, storedHash) {
    if (!storedHash?.includes(':')) return false;
    const [salt, key] = storedHash.split(':');
    const derivedKey = await scrypt(password, salt, 64);
    return crypto.timingSafeEqual(Buffer.from(key, 'hex'), derivedKey);
  }

  async function register({ email, password, displayName }) {
    const existing = await getUserByEmail(email.toLowerCase());
    if (existing) {
      const error = new Error('User already exists');
      error.code = 'USER_EXISTS';
      throw error;
    }
    const user = {
      userId: createUserId(),
      email: email.toLowerCase(),
      displayName,
      role: 'buyer',
      status: 'active',
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await saveUser(user);
    return publicUser(user);
  }

  async function login({ email, password }) {
    const user = await getUserByEmail(email.toLowerCase());
    const valid = user && (verifyPasswordDependency
      ? await verifyPasswordDependency(password, user.passwordHash)
      : await verifyPassword(password, user.passwordHash));
    if (!valid) {
      const error = new Error('Invalid credentials');
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }
    const accessToken = signToken({ type: 'access', userId: user.userId, role: user.role });
    const refreshToken = signToken({ type: 'refresh', userId: user.userId, tokenId: crypto.randomUUID() });
    await saveRefreshToken({ userId: user.userId, tokenHash: hashToken(refreshToken), createdAt: new Date().toISOString() });
    return { accessToken, refreshToken, user: publicUser(user) };
  }

  async function me(userId) {
    const user = await getUser(userId);
    if (!user) {
      const error = new Error('User not found');
      error.code = 'USER_NOT_FOUND';
      throw error;
    }
    return publicUser(user);
  }

  async function refresh(refreshToken) {
    const payload = verifyTokenValue(refreshToken, process.env.AUTH_TOKEN_SECRET || 'development-only-secret');
    const stored = await getRefreshToken(hashToken(refreshToken || ''));
    if (!payload || payload.type !== 'refresh' || !stored) {
      const error = new Error('Invalid refresh token');
      error.code = 'INVALID_REFRESH_TOKEN';
      throw error;
    }
    const user = await getUser(payload.userId);
    if (!user) throw new Error('User not found');
    await deleteRefreshToken(hashToken(refreshToken));
    const accessToken = signToken({ type: 'access', userId: user.userId, role: user.role });
    const nextRefreshToken = signToken({ type: 'refresh', userId: user.userId, tokenId: crypto.randomUUID() });
    await saveRefreshToken({ userId: user.userId, tokenHash: hashToken(nextRefreshToken), createdAt: new Date().toISOString() });
    return { accessToken, refreshToken: nextRefreshToken, user: publicUser(user) };
  }

  async function logout(refreshToken) {
    if (refreshToken) await deleteRefreshToken(hashToken(refreshToken));
  }

  return { register, login, refresh, logout, me, hashPassword, verifyPassword };
}

function signTokenValue(payload, secret) {
  const encoded = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + (payload.type === 'access' ? 15 * 60e3 : 30 * 24 * 60 * 60e3) })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function verifyTokenValue(token, secret) {
  if (!token) return undefined;
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return undefined;
  const expected = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return undefined;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    return payload.exp > Date.now() ? payload : undefined;
  } catch (error) { return undefined; }
}

function publicUser(user) {
  return { userId: user.userId, email: user.email, displayName: user.displayName, role: user.role, status: user.status };
}

module.exports = { createAuthService, hashToken, signTokenValue, verifyTokenValue };
