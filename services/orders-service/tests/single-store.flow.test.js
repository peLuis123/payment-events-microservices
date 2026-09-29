const request = require('supertest');
const { createApp } = require('../src/app');
const { createCatalogService } = require('../services/catalog.service');
const { createSessionAuth } = require('../middlewares/session-auth');
const { signTokenValue } = require('../services/auth.service');
const cookie = (role) =>
  'access_token=' +
  signTokenValue({ type: 'access', userId: role, role }, 'test');
function setup() {
  const products = new Map(),
    categories = new Map();
  const repository = {
    saveProduct: async (p) => products.set(p.productId, p),
    saveCategory: async (c) => categories.set(c.categoryId, c),
    getProduct: async (id) => products.get(id),
    getCategory: async (id) => categories.get(id),
    listProducts: async (id) =>
      [...products.values()].filter((p) => p.merchantId === id),
    listCategories: async (id) =>
      [...categories.values()].filter((c) => c.merchantId === id),
    patchProduct: async (p, changes) => {
      const updated = { ...p, ...changes };
      products.set(p.productId, updated);
      return updated;
    },
    patchCategory: async (c, changes) => {
      const updated = { ...c, ...changes };
      categories.set(c.categoryId, updated);
      return updated;
    },
  };
  const legacyLookup = jest.fn(() => {
    throw Error('Merchant tables must not be queried');
  });
  const cartCreationService = { create: jest.fn(async (body) => body) };
  const orders = { listOrders: jest.fn(async () => []) };
  const paymentClient = {
    getBalance: jest.fn(async () => ({ available: 0, currency: 'USD' })),
  };
  const app = createApp({
    orderService: {},
    storefrontMerchantId: 'store',
    catalogService: createCatalogService(repository),
    catalogRepository: repository,
    cartCreationService,
    commerceRepository: orders,
    paymentClient,
    getMerchant: legacyLookup,
    getMembership: legacyLookup,
    listMemberships: legacyLookup,
    sessionAuth: createSessionAuth({ secret: 'test', optional: true }),
    logger: { warn: jest.fn(), error: jest.fn() },
  });
  return { app, legacyLookup, cartCreationService, orders, paymentClient };
}
test('admin creates, edits and deactivates a product with no merchant records or headers', async () => {
  const { app, legacyLookup } = setup();
  const admin = cookie('admin');
  await request(app).get('/products').expect(200, []);
  const c = await request(app)
    .post('/categories')
    .set('Cookie', admin)
    .send({ name: 'Home' })
    .expect(201);
  const p = await request(app)
    .post('/products')
    .set('Cookie', admin)
    .send({
      name: 'Vase',
      price: 1000,
      currency: 'USD',
      stock: 4,
      categoryId: c.body.categoryId,
    })
    .expect(201);
  expect(p.body.merchantId).toBe('store');
  const url = '/products/' + p.body.productId;
  await request(app).get(url).expect(200);
  await request(app)
    .patch(url)
    .set('Cookie', cookie('buyer'))
    .send({ price: 2000 })
    .expect(403);
  const changed = await request(app)
    .patch(url)
    .set('Cookie', admin)
    .send({ price: 1500 })
    .expect(200);
  expect(changed.body.price).toBe(1500);
  await request(app)
    .patch(url)
    .set('Cookie', admin)
    .send({ status: 'inactive' })
    .expect(200);
  await request(app).get('/products').expect(200, []);
  await request(app).get(url).expect(401);
  const listed = await request(app)
    .get('/products?includeInactive=true')
    .set('Cookie', admin)
    .expect(200);
  expect(listed.body).toHaveLength(1);
  await request(app)
    .patch('/categories/' + c.body.categoryId)
    .set('Cookie', admin)
    .send({ status: 'inactive' })
    .expect(200);
  expect(legacyLookup).not.toHaveBeenCalled();
});
test('admin panel reads fixed-store orders and balance without store selection', async () => {
  const { app, orders, paymentClient } = setup();
  for (const path of ['/admin/orders', '/admin/balance']) {
    await request(app).get(path).expect(401);
    await request(app).get(path).set('Cookie', cookie('buyer')).expect(403);
    await request(app).get(path).set('Cookie', cookie('admin')).expect(200);
  }
  expect(orders.listOrders).toHaveBeenCalledWith('store');
  expect(paymentClient.getBalance).toHaveBeenCalledWith('store');
});
test('buyer creates a cart in the fixed store and cannot override it', async () => {
  const { app, cartCreationService } = setup();
  await request(app)
    .post('/carts')
    .set('Cookie', cookie('buyer'))
    .send({ currency: 'USD' })
    .expect(201);
  expect(cartCreationService.create).toHaveBeenCalledWith({
    merchantId: 'store',
    userId: 'buyer',
    currency: 'USD',
  });
  await request(app)
    .post('/carts')
    .set('Cookie', cookie('buyer'))
    .send({ merchantId: 'foreign' })
    .expect(400);
  await request(app).get('/products?merchantId=foreign').expect(403);
});
