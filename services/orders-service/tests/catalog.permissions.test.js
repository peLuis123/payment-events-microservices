const request = require('supertest');
const { createApp } = require('../src/app');
const { createCatalogService } = require('../services/catalog.service');
function setup(role = 'admin', member = true) {
  const product = {
    productId: 'p1',
    merchantId: 'm1',
    name: 'Vase',
    price: 1000,
    currency: 'USD',
    stock: 5,
    status: 'active',
  };
  const category = {
    categoryId: 'c1',
    merchantId: 'm1',
    name: 'Home',
    status: 'active',
  };
  const repository = {
    getProduct: jest.fn().mockResolvedValue(product),
    getCategory: jest.fn().mockResolvedValue(category),
    listProducts: jest
      .fn()
      .mockResolvedValue([
        product,
        { ...product, productId: 'inactive', status: 'inactive' },
      ]),
    listCategories: jest.fn().mockResolvedValue([category]),
    saveProduct: jest.fn(),
    saveCategory: jest.fn(),
    patchProduct: jest.fn(async (p, changes) => ({ ...p, ...changes })),
    patchCategory: jest.fn(async (c, changes) => ({ ...c, ...changes })),
    getInventory: jest
      .fn()
      .mockResolvedValue({
        productId: 'p1',
        availableQuantity: 5,
        reservedQuantity: 0,
      }),
    updateInventory: jest.fn().mockResolvedValue({ availableQuantity: 10 }),
  };
  const app = createApp({
    orderService: {},
    catalogService: createCatalogService(repository),
    catalogRepository: repository,
    getMembership: async () =>
      member ? { role: 'admin', status: 'active' } : undefined,
    sessionAuth: (req, res, next) => {
      if (role) req.user = { userId: 'u1', role };
      next();
    },
    logger: { warn: jest.fn(), error: jest.fn() },
  });
  return { app, repository };
}
const writes = [
  [
    'post',
    '/products',
    { name: 'Vase', price: 1000, currency: 'USD', stock: 3 },
  ],
  ['post', '/categories', { name: 'Home' }],
  ['patch', '/products/p1', { price: 2000 }],
  ['patch', '/categories/c1', { status: 'inactive' }],
  [
    'patch',
    '/products/p1/inventory',
    { availableQuantity: 10, expectedAvailableQuantity: 5 },
  ],
];
test.each(writes)('buyer cannot %s %s', async (method, path, body) => {
  const { app, repository } = setup('buyer');
  await request(app)
    [method](path)
    .set('X-Merchant-Id', 'm1')
    .send(body)
    .expect(403);
  expect(repository.saveProduct).not.toHaveBeenCalled();
  expect(repository.patchProduct).not.toHaveBeenCalled();
  expect(repository.updateInventory).not.toHaveBeenCalled();
});
test.each(writes)('anonymous cannot %s %s', async (method, path, body) => {
  await request(setup(null).app)
    [method](path)
    .set('X-Merchant-Id', 'm1')
    .send(body)
    .expect(401);
});
test.each(writes)(
  'unrelated admin cannot %s %s',
  async (method, path, body) => {
    await request(setup('admin', false).app)
      [method](path)
      .set('X-Merchant-Id', 'm1')
      .send(body)
      .expect(403);
  },
);
test.each(writes)('member admin can %s %s', async (method, path, body) => {
  await request(setup().app)
    [method](path)
    .set('X-Merchant-Id', 'm1')
    .send(body)
    .expect(method === 'post' ? 201 : 200);
});
test.each([
  { merchantId: 'other' },
  { productId: 'other' },
  { stock: 999 },
  { price: -1 },
  { price: 1.5 },
  { status: 'deleted' },
  {},
  { name: null },
])('rejects unsafe product patch %j', async (body) => {
  await request(setup().app).patch('/products/p1').send(body).expect(400);
});
test('cannot assign a category from another merchant', async () => {
  const { app, repository } = setup();
  repository.getCategory.mockResolvedValue({
    merchantId: 'other',
    status: 'active',
  });
  await request(app)
    .patch('/products/p1')
    .send({ categoryId: 'other-category' })
    .expect(400);
  expect(repository.patchProduct).not.toHaveBeenCalled();
});
test('public catalog excludes inactive products and can read active detail', async () => {
  const { app } = setup(null);
  const result = await request(app)
    .get('/products')
    .set('X-Merchant-Id', 'm1')
    .expect(200);
  expect(result.body).toHaveLength(1);
  await request(app).get('/products/p1').expect(200);
  await request(app)
    .get('/products?includeInactive=true')
    .set('X-Merchant-Id', 'm1')
    .expect(401);
  await request(app).get('/products/p1/inventory').expect(401);
});
test('missing product returns 404', async () => {
  const { app, repository } = setup();
  repository.getProduct.mockResolvedValue(undefined);
  await request(app).get('/products/missing').expect(404);
});

test('real signed sessions enforce buyer/admin roles even when API-key middleware is enabled', async () => {
  const { createSessionAuth } = require('../middlewares/session-auth');
  const { createMerchantAuth } = require('../middlewares/merchant-auth');
  const { signTokenValue } = require('../services/auth.service');
  const createProduct = jest.fn().mockResolvedValue({ productId: 'new' });
  const app = createApp({
    orderService: {},
    catalogService: { createProduct },
    sessionAuth: createSessionAuth({ secret: 'test', optional: true }),
    merchantAuth: createMerchantAuth({ keys: { secret: 'm1' } }),
    getMembership: async () => ({ role: 'admin', status: 'active' }),
    logger: { warn: jest.fn(), error: jest.fn() },
  });
  const body = { name: 'Vase', price: 1000, currency: 'USD' };
  for (const role of ['buyer', 'admin']) {
    const token = signTokenValue(
      { type: 'access', userId: 'u1', role },
      'test',
    );
    await request(app)
      .post('/products')
      .set('Cookie', 'access_token=' + token)
      .set('X-Merchant-Id', 'm1')
      .send(body)
      .expect(role === 'admin' ? 201 : 403);
  }
  expect(createProduct).toHaveBeenCalledTimes(1);
});
