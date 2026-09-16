const request = require('supertest');
const { createApp } = require('../src/app');

describe('POST /orders', () => {
  test('returns 400 without exposing validation details', async () => {
    const orderService = { createOrder: jest.fn() };
    const logger = { warn: jest.fn(), error: jest.fn() };
    const app = createApp({ orderService, logger });

    const response = await request(app).post('/orders').send({
      orderId: 'invalid-order',
      amount: -20,
      currency: 'dollars'
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Invalid order payload',
      code: 'INVALID_ORDER'
    });
    expect(response.body).not.toHaveProperty('stack');
    expect(orderService.createOrder).not.toHaveBeenCalled();
  });
});
