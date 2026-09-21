const request = require('supertest');
const { createApp } = require('../src/app');

describe('session routes', () => {
  test('returns the current user from the access cookie', async () => {
    const authService = {
      me: jest.fn().mockResolvedValue({ userId: 'user-123', role: 'buyer' })
    };
    const sessionAuth = (req, res, next) => { req.user = { userId: 'user-123', role: 'buyer' }; next(); };
    const app = createApp({ orderService: { createOrder: jest.fn() }, authService, sessionAuth, logger: { warn: jest.fn(), error: jest.fn() } });

    await request(app).get('/auth/me').expect(200, { userId: 'user-123', role: 'buyer' });
    expect(authService.me).toHaveBeenCalledWith('user-123');
  });

  test('refreshes and clears cookies on logout', async () => {
    const authService = {
      refresh: jest.fn().mockResolvedValue({ accessToken: 'access-2', refreshToken: 'refresh-2', user: { userId: 'user-123' } }),
      logout: jest.fn().mockResolvedValue(undefined)
    };
    const app = createApp({ orderService: { createOrder: jest.fn() }, authService, logger: { warn: jest.fn(), error: jest.fn() } });

    await request(app).post('/auth/refresh').set('Cookie', 'refresh_token=refresh-1').expect(200);
    await request(app).post('/auth/logout').set('Cookie', 'refresh_token=refresh-1').expect(204);
    expect(authService.logout).toHaveBeenCalledWith('refresh-1');
  });
});
