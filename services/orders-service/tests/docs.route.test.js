const request = require('supertest');
const { createApp } = require('../src/app');

describe('GET /docs', () => {
  test('serves the Swagger UI', async () => {
    const app = createApp({
      orderService: { createOrder: jest.fn() },
      logger: { warn: jest.fn(), error: jest.fn() }
    });

    const response = await request(app).get('/docs').redirects(1);

    expect(response.status).toBe(200);
    expect(response.text).toContain('swagger-ui');
  });

  test('redirects the root URL to Swagger UI', async () => {
    const app = createApp({
      orderService: { createOrder: jest.fn() },
      logger: { warn: jest.fn(), error: jest.fn() }
    });

    const response = await request(app).get('/');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/docs/');
  });
});
