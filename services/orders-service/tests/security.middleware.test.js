const request = require('supertest');
const express = require('express');
const { createMerchantAuth } = require('../middlewares/merchant-auth');
const { createRateLimiter } = require('../middlewares/rate-limiter');

describe('merchant security middleware', () => {
  test('accepts a configured merchant API key and sets merchant identity', async () => {
    const app = express();
    app.use(createMerchantAuth({ keys: { 'key-123': 'merchant-123' } }));
    app.get('/protected', (request, response) => response.json({ merchantId: request.merchantId }));

    const response = await request(app)
      .get('/protected')
      .set('X-Api-Key', 'key-123');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ merchantId: 'merchant-123' });
  });

  test('rejects an unknown API key', async () => {
    const app = express();
    app.use(createMerchantAuth({ keys: { 'key-123': 'merchant-123' } }));
    app.get('/protected', (request, response) => response.sendStatus(200));

    await request(app).get('/protected').set('X-Api-Key', 'wrong')
      .expect(401);
  });

  test('limits requests per identity', async () => {
    const app = express();
    app.use(createRateLimiter({ windowMs: 60000, max: 1 }));
    app.get('/limited', (request, response) => response.sendStatus(200));

    await request(app).get('/limited').expect(200);
    await request(app).get('/limited').expect(429);
  });
});
