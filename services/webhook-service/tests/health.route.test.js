const request = require('supertest');
const { createApp } = require('../src/app');

describe('GET /', () => {
  test('returns a friendly webhook API status message', async () => {
    const app = createApp({
      verifyStripe: jest.fn(),
      mapStripeEvent: jest.fn(),
      verifyPayPal: jest.fn(),
      mapPayPalEvent: jest.fn(),
      processWebhook: jest.fn(),
      logger: { error: jest.fn() }
    });

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      service: 'webhook-service',
      status: 'ok',
      message: 'Webhook API is running'
    });
  });
});
