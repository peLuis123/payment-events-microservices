const request = require('supertest');
const { createApp } = require('../src/app');

describe('catalog routes', () => {
  test('admin creates a product', async () => {
    const catalogService = {
      createProduct: jest.fn().mockResolvedValue({ productId: 'product-123', status: 'active' })
    };
    const sessionAuth = (request, response, next) => { request.user = { role: 'admin' }; next(); };
    const app = createApp({ orderService: { createOrder: jest.fn() }, catalogService, sessionAuth, logger: { warn: jest.fn(), error: jest.fn() } });

    const response = await request(app)
      .post('/products')
      .set('X-Merchant-Id', 'merchant-123')
      .send({ name: 'Keyboard', price: 5799, currency: 'USD', stock: 10 });

    expect(response.status).toBe(201);
    expect(catalogService.createProduct).toHaveBeenCalledWith(expect.objectContaining({ merchantId: 'merchant-123' }));
  });

  test('rejects product mutation without admin role', async () => {
    const sessionAuth = (request, response, next) => { request.user = { role: 'buyer' }; next(); };
    const app = createApp({ orderService: { createOrder: jest.fn() }, catalogService: { createProduct: jest.fn() }, sessionAuth, logger: { warn: jest.fn(), error: jest.fn() } });
    await request(app).post('/products').set('X-Merchant-Id', 'merchant-123').send({ name: 'Keyboard', price: 5799, currency: 'USD' }).expect(403);
  });
});
