const request = require('supertest');
const { createApp } = require('../src/app');

describe('GET /commercial-orders', () => {
  test('lists orders for the authenticated user', async () => {
    const commerceRepository = { listOrdersByUser: jest.fn().mockResolvedValue([{ orderId: 'order-123', userId: 'user-123' }]) };
    const sessionAuth = (req, res, next) => { req.user = { userId: 'user-123', role: 'buyer' }; next(); };
    const app = createApp({ orderService: { createOrder: jest.fn() }, commerceRepository, sessionAuth, logger: { warn: jest.fn(), error: jest.fn() } });

    await request(app).get('/commercial-orders').expect(200, [{ orderId: 'order-123', userId: 'user-123' }]);
    expect(commerceRepository.listOrdersByUser).toHaveBeenCalledWith('user-123');
  });
});
