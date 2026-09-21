const crypto = require('node:crypto');

function createSessionAuth({ secret = process.env.AUTH_TOKEN_SECRET || 'development-only-secret', optional = false } = {}) {
  return function sessionAuth(request, response, next) {
    const token = parseCookies(request.headers.cookie || '').access_token;
    const user = token && verifyToken(token, secret);
    if (!user && !optional) {
      response.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }
    if (user) request.user = user;
    next();
  };
}

function parseCookies(header) {
  return Object.fromEntries(header.split(';').map((part) => part.trim().split('=')));
}

function verifyToken(token, secret) {
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return undefined;
  const expected = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return undefined;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    return payload.exp > Date.now() ? payload : undefined;
  } catch (error) {
    return undefined;
  }
}

module.exports = { createSessionAuth, parseCookies, verifyToken };
