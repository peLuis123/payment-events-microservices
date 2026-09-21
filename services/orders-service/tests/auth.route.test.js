const request = require('supertest');
const { createApp } = require('../src/app');

describe('auth routes', () => {
  test('registers a user', async () => {
    const authService = {
      register: jest.fn().mockResolvedValue({ userId: 'user-123', email: 'buyer@example.com', role: 'buyer' })
    };
    const app = createApp({ orderService: { createOrder: jest.fn() }, authService, logger: { warn: jest.fn(), error: jest.fn() } });

    const response = await request(app)
      .post('/auth/register')
      .send({ email: 'buyer@example.com', password: 'StrongPassword123!', displayName: 'Buyer' });

    expect(response.status).toBe(201);
    expect(response.body.userId).toBe('user-123');
  });

  test('logs in and sets HttpOnly cookies', async () => {
    const authService = {
      login: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { userId: 'user-123' }
      })
    };
    const app = createApp({ orderService: { createOrder: jest.fn() }, authService, logger: { warn: jest.fn(), error: jest.fn() } });

    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'buyer@example.com', password: 'StrongPassword123!' });

    expect(response.status).toBe(200);
    expect(response.headers['set-cookie'].join(';')).toContain('HttpOnly');
  });
});
