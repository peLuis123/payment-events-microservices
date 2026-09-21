const request = require('supertest');
const express = require('express');
const { createSessionAuth } = require('../middlewares/session-auth');
const { signTokenValue } = require('../services/auth.service');

describe('session auth middleware', () => {
  test('authenticates an admin from the access cookie', async () => {
    const app = express();
    app.use(createSessionAuth({ secret: 'test-secret' }));
    app.get('/admin', (request, response) => response.json(request.user));
    const token = signTokenValue({ type: 'access', userId: 'user-123', role: 'admin' }, 'test-secret');

    const response = await request(app).get('/admin').set('Cookie', `access_token=${token}`).expect(200);
    expect(response.body).toEqual(expect.objectContaining({
      type: 'access', userId: 'user-123', role: 'admin', exp: expect.any(Number)
    }));
  });

  test('rejects a missing access cookie', async () => {
    const app = express();
    app.use(createSessionAuth({ secret: 'test-secret' }));
    app.get('/admin', (request, response) => response.sendStatus(200));
    await request(app).get('/admin').expect(401);
  });
});
