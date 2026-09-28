const request = require('supertest');
const { createApp } = require('../src/app');
const { createCartService } = require('../services/cart.service');
function setup() {
  const cart = {
    cartId: 'c1',
    userId: 'u1',
    merchantId: 'm1',
    currency: 'USD',
    status: 'active',
  };
  const product = {
    productId: 'p1',
    merchantId: 'm1',
    price: 1000,
    currency: 'USD',
    stock: 4,
    status: 'active',
  };
  const repository = {
    getCart: async () => cart,
    getCartItem: jest.fn().mockResolvedValue({ quantity: 1 }),
    setCartItem: jest.fn(),
    removeCartItem: jest.fn(),
  };
  const cartService = createCartService({
    ...repository,
    getProduct: async () => product,
  });
  const app = createApp({
    orderService: {},
    cartService,
    commerceRepository: repository,
    sessionAuth: (req, res, next) => {
      req.user = { userId: 'u1', role: 'buyer' };
      next();
    },
    logger: { warn: jest.fn(), error: jest.fn() },
  });
  return { app, repository, product };
}
test('owner updates an existing quantity and removes the item', async () => {
  const { app, repository } = setup();
  await request(app)
    .patch('/carts/c1/items/p1')
    .send({ quantity: 3 })
    .expect(204);
  expect(repository.setCartItem).toHaveBeenCalledWith(
    expect.objectContaining({ quantity: 3 }),
  );
  await request(app).delete('/carts/c1/items/p1').expect(204);
  expect(repository.removeCartItem).toHaveBeenCalledWith(
    expect.objectContaining({ productId: 'p1' }),
  );
});
test.each([0, -1, 1.5, '2'])('rejects quantity %s', async (quantity) => {
  await request(setup().app)
    .patch('/carts/c1/items/p1')
    .send({ quantity })
    .expect(400);
});
test('rejects excess stock and does not accept client price', async () => {
  const { app, repository } = setup();
  await request(app)
    .patch('/carts/c1/items/p1')
    .send({ quantity: 5 })
    .expect(409);
  await request(app)
    .patch('/carts/c1/items/p1')
    .send({ quantity: 1, unitAmount: 1 })
    .expect(400);
  expect(repository.setCartItem).not.toHaveBeenCalled();
});
test('patch does not create an item that is absent', async () => {
  const { app, repository } = setup();
  repository.getCartItem.mockResolvedValue(undefined);
  await request(app)
    .patch('/carts/c1/items/p1')
    .send({ quantity: 1 })
    .expect(404);
});
