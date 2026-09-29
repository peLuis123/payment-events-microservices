const request = require('supertest');
const { createApp } = require('../src/app');
function setup(user = { userId: 'buyer-1', role: 'buyer' }) {
  const cart = {
    cartId: 'cart-1',
    userId: 'buyer-1',
    merchantId: 'shop-1',
    currency: 'USD',
  };
  const repository = {
    getCart: jest.fn().mockResolvedValue(cart),
    getCartItems: jest.fn().mockResolvedValue([]),
    getOrder: jest.fn().mockResolvedValue({
      orderId: 'order-1',
      userId: 'buyer-1',
      merchantId: 'shop-1',
    }),
    listOrders: jest.fn().mockResolvedValue([{ orderId: 'all-store-orders' }]),
    listOrdersByUser: jest.fn().mockResolvedValue([]),
  };
  const getMembership = jest
    .fn()
    .mockResolvedValue({ role: 'admin', status: 'active' });
  const cartService = { addItem: jest.fn().mockResolvedValue({}) };
  const commercialOrderService = {
    createFromCart: jest.fn().mockResolvedValue({}),
    createCheckout: jest.fn().mockResolvedValue({}),
  };
  const inventoryService = { reserve: jest.fn().mockResolvedValue({}) };
  const paymentClient = {
    getPayment: jest.fn().mockResolvedValue({
      paymentId: 'pay-1',
      userId: 'buyer-1',
      merchantId: 'shop-1',
    }),
  };
  const app = createApp({
    storefrontMerchantId: 'shop-1',
    orderService: {},
    commerceRepository: repository,
    cartService,
    commercialOrderService,
    inventoryService,
    paymentClient,
    getMembership,
    sessionAuth: (req, res, next) => {
      req.user = user;
      next();
    },
    logger: { warn: jest.fn(), error: jest.fn() },
  });
  return {
    app,
    repository,
    getMembership,
    cartService,
    commercialOrderService,
    inventoryService,
    paymentClient,
  };
}
test.each([
  ['get', '/carts/cart-1', {}],
  ['post', '/carts/cart-1/items', { productId: 'p1', quantity: 1 }],
  ['post', '/commercial-orders', { cartId: 'cart-1' }],
  ['post', '/commercial-orders/order-1/checkout', {}],
  ['post', '/commercial-orders/order-1/inventory-reservations', {}],
  ['get', '/payments/pay-1', {}],
])('rejects another buyer on %s %s', async (method, path, body) => {
  const { app, cartService, commercialOrderService, inventoryService } = setup({
    userId: 'intruder',
    role: 'buyer',
  });
  await request(app)
    [method](path)
    .set('X-Merchant-Id', 'shop-1')
    .send(body)
    .expect(403);
  expect(cartService.addItem).not.toHaveBeenCalled();
  expect(commercialOrderService.createCheckout).not.toHaveBeenCalled();
  expect(inventoryService.reserve).not.toHaveBeenCalled();
});
test('raw merchant header cannot authorize anonymous payment access', async () => {
  const { app, paymentClient } = setup(null);
  await request(app)
    .get('/payments/pay-1')
    .set('X-Merchant-Id', 'shop-1')
    .expect(401);
  expect(paymentClient.getPayment).not.toHaveBeenCalled();
});
test('owner can read cart and payment', async () => {
  const { app } = setup();
  await request(app).get('/carts/cart-1').expect(200);
  await request(app).get('/payments/pay-1').expect(200);
});
test('admin lists only configured store orders without memberships', async () => {
  const { app, repository, getMembership } = setup({
    userId: 'admin-1',
    role: 'admin',
  });
  await request(app)
    .get('/merchants/shop-1/orders')
    .expect(200, [{ orderId: 'all-store-orders' }]);
  expect(repository.listOrders).toHaveBeenCalledWith('shop-1');
  expect(getMembership).not.toHaveBeenCalled();
  getMembership.mockResolvedValue(undefined);
  await request(app).get('/merchants/other/orders').expect(403);
  expect(repository.listOrders).toHaveBeenCalledTimes(1);
});
test('buyer cannot request the admin list', async () => {
  const { app, repository } = setup();
  await request(app).get('/merchants/shop-1/orders').expect(403);
  expect(repository.listOrders).not.toHaveBeenCalled();
});
test('reserves using only the authorized order ID', async () => {
  const { app, inventoryService } = setup();
  await request(app)
    .post('/commercial-orders/order-1/inventory-reservations')
    .send({ productId: 'evil', quantity: 100 })
    .expect(201);
  expect(inventoryService.reserve).toHaveBeenCalledWith({ orderId: 'order-1' });
});

test('admin reads only configured store payments', async () => {
  const { app, getMembership, paymentClient } = setup({
    userId: 'admin-1',
    role: 'admin',
  });
  await request(app).get('/payments/pay-1').expect(200);
  expect(getMembership).not.toHaveBeenCalled();
  paymentClient.getPayment.mockResolvedValue({
    merchantId: 'other',
    userId: 'buyer-1',
  });
  await request(app)
    .get('/payments/pay-1')
    .set('X-Merchant-Id', 'shop-1')
    .expect(403);
});

test.each([
  ['patch', '/carts/cart-1/items/p1'],
  ['delete', '/carts/cart-1/items/p1'],
  ['get', '/commercial-orders/order-1'],
])('rejects cross-owner access to %s %s', async (method, path) => {
  await request(setup({ userId: 'intruder', role: 'buyer' }).app)
    [method](path)
    .send({ quantity: 1 })
    .expect(403);
});
test('order detail includes saved lines for owner or member admin', async () => {
  const { app, repository } = setup();
  repository.getOrder.mockResolvedValue({
    orderId: 'order-1',
    userId: 'buyer-1',
    merchantId: 'shop-1',
    items: [{ productId: 'p1', quantity: 2 }],
  });
  const response = await request(app)
    .get('/commercial-orders/order-1')
    .expect(200);
  expect(response.body.items).toEqual([{ productId: 'p1', quantity: 2 }]);
});
