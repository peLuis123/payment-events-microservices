const request = require('supertest');
const { createApp } = require('../src/app');

describe('POST /orders', () => {
  test('returns 202 and the event id for a valid order', async () => {
    const orderService = {
      createOrder: jest.fn().mockResolvedValue({ eventId: 'event-123' })
    };
    const logger = { warn: jest.fn(), error: jest.fn() };
    const app = createApp({ orderService, logger });
    const order = {
      orderId: 'order-123',
      customerId: 'customer-456',
      amount: 49.99,
      currency: 'USD'
    };

    const response = await request(app).post('/orders').send(order);

    expect(response.status).toBe(202);
    expect(response.body).toEqual({
      message: 'Order accepted',
      eventId: 'event-123'
    });
    expect(orderService.createOrder).toHaveBeenCalledWith(order);
  });
});
