function createRateLimiter({ windowMs = 60000, max = 60, now = () => Date.now() } = {}) {
  const buckets = new Map();

  return function rateLimiter(request, response, next) {
    const key = request.get('X-Api-Key') || request.ip;
    const current = buckets.get(key);
    const timestamp = now();
    if (!current || timestamp - current.startedAt >= windowMs) {
      buckets.set(key, { startedAt: timestamp, count: 1 });
      next();
      return;
    }
    if (current.count >= max) {
      response.status(429).json({ error: 'Rate limit exceeded', code: 'RATE_LIMITED' });
      return;
    }
    current.count += 1;
    next();
  };
}

module.exports = { createRateLimiter };
