const request = require('supertest');
const { createApp } = require('../src/app');
const { createSessionAuth } = require('../middlewares/session-auth');
const { createMerchantAuth } = require('../middlewares/merchant-auth');
const { signTokenValue } = require('../services/auth.service');
function setup({
  role = 'admin',
  ids = ['m1'],
  revoked = false,
  inactive = false,
} = {}) {
  const catalogService = { createProduct: jest.fn(async (body) => body) };
  const paymentClient = {
    getPayment: jest.fn(async () => ({ merchantId: 'm2', userId: 'buyer' })),
    createRefund: jest.fn(async () => ({})),
    createPayout: jest.fn(async () => ({})),
    getBalance: jest.fn(async () => ({})),
  };
  const checkoutService = { createSession: jest.fn(async (body) => body) };
  const merchantService = { create: jest.fn(async (body) => body) };
  const app = createApp({
    orderService: {},
    catalogService,
    paymentClient,
    checkoutService,
    merchantService,
    catalogRepository: {
      listProducts: jest.fn(async () => [{ status: 'active' }]),
      getProduct: async () => ({
        productId: 'p1',
        merchantId: 'm1',
        status: 'inactive',
      }),
    },
    sessionAuth: createSessionAuth({ secret: 'test', optional: true }),
    merchantAuth: createMerchantAuth({ keys: { 'server-key': 'm1' } }),
    getMembership: async (id, userId) =>
      ids.includes(id) && userId === 'u1'
        ? { role: 'admin', status: revoked ? 'inactive' : 'active' }
        : undefined,
    listMemberships: async () => ids.map((merchantId) => ({ merchantId })),
    getMerchant: async (merchantId) => ({
      merchantId,
      name: merchantId,
      status: inactive ? 'inactive' : 'active',
    }),
    storefrontMerchantId: 'm1',
    logger: { error: jest.fn(), warn: jest.fn() },
  });
  const cookie =
    'access_token=' +
    signTokenValue({ type: 'access', userId: 'u1', role }, 'test');
  return {
    app,
    cookie,
    catalogService,
    paymentClient,
    merchantService,
    checkoutService,
  };
}
const product = { name: 'Vase', price: 1000, currency: 'USD' };
test('one membership resolves automatically and ignores forged merchant header', async () => {
  const { app, cookie, catalogService } = setup();
  await request(app)
    .post('/products')
    .set('Cookie', cookie)
    .set('X-Merchant-Id', 'victim')
    .send(product)
    .expect(201);
  expect(catalogService.createProduct).toHaveBeenCalledWith(
    expect.objectContaining({ merchantId: 'm1' }),
  );
});
test('multiple stores require selection and reject a foreign store', async () => {
  const { app, cookie } = setup({ ids: ['m1', 'm2'] });
  const list = await request(app)
    .get('/me/merchants')
    .set('Cookie', cookie)
    .expect(200);
  expect(list.body.map((m) => m.merchantId)).toEqual(['m1', 'm2']);
  const ambiguous = await request(app)
    .post('/products')
    .set('Cookie', cookie)
    .send(product)
    .expect(409);
  expect(ambiguous.body.code).toBe('MERCHANT_SELECTION_REQUIRED');
  await request(app)
    .post('/products?merchantId=m2')
    .set('Cookie', cookie)
    .send(product)
    .expect(201);
  await request(app)
    .post('/products?merchantId=foreign')
    .set('Cookie', cookie)
    .send(product)
    .expect(403);
});
test.each([{ ids: [] }, { revoked: true }, { inactive: true }])(
  'no usable membership grants no access: %j',
  async (options) => {
    const { app, cookie, catalogService } = setup(options);
    const result = await request(app)
      .get('/me/merchants')
      .set('Cookie', cookie)
      .expect(200);
    expect(result.body).toEqual([]);
    await request(app)
      .post('/products')
      .set('Cookie', cookie)
      .send(product)
      .expect(403);
    expect(catalogService.createProduct).not.toHaveBeenCalled();
  },
);
test('anonymous and buyer cannot list administrative memberships', async () => {
  const { app, cookie } = setup({ role: 'buyer' });
  await request(app).get('/me/merchants').expect(401);
  await request(app).get('/me/merchants').set('Cookie', cookie).expect(403);
});
test.each([
  '/refunds',
  '/payouts',
  '/products',
  '/merchants',
  '/checkout/sessions',
  '/orders',
])('raw merchant header never authorizes POST %s', async (path) => {
  await request(setup().app)
    .post(path)
    .set('X-Merchant-Id', 'm1')
    .send(product)
    .expect(401);
});
test('refund derives merchant from payment; header cannot move it to own store', async () => {
  const { app, cookie, paymentClient } = setup();
  await request(app)
    .post('/refunds')
    .set('Cookie', cookie)
    .set('X-Merchant-Id', 'm1')
    .set('Idempotency-Key', 'refund-1')
    .send({ paymentId: 'p1', amount: 100, currency: 'USD' })
    .expect(403);
  expect(paymentClient.createRefund).not.toHaveBeenCalled();
});
test('member admin can refund a payment from their store without merchant header', async () => {
  const { app, cookie, paymentClient } = setup({ ids: ['m2'] });
  await request(app)
    .post('/refunds')
    .set('Cookie', cookie)
    .set('Idempotency-Key', 'refund-1')
    .send({ paymentId: 'p1', amount: 100, currency: 'USD' })
    .expect(201);
  expect(paymentClient.createRefund).toHaveBeenCalledTimes(1);
});
test('balance validates path membership and cannot be accessed using only an API key', async () => {
  const { app, cookie, paymentClient } = setup();
  await request(app)
    .get('/merchants/m2/balance')
    .set('Cookie', cookie)
    .set('X-Merchant-Id', 'm2')
    .expect(403);
  await request(app)
    .get('/merchants/m1/balance')
    .set('X-Api-Key', 'server-key')
    .expect(401);
  expect(paymentClient.getBalance).not.toHaveBeenCalled();
  await request(app)
    .get('/merchants/m1/balance')
    .set('Cookie', cookie)
    .expect(200);
});
test('payout requires member admin and auto-selects the only store', async () => {
  const { app, cookie, paymentClient } = setup();
  const body = {
    payoutId: 'out-1',
    provider: 'paypal',
    merchantAccountId: 'account',
    amount: 100,
    currency: 'USD',
  };
  await request(app)
    .post('/payouts?merchantId=m2')
    .set('Cookie', cookie)
    .set('Idempotency-Key', 'k')
    .send(body)
    .expect(403);
  expect(paymentClient.createPayout).not.toHaveBeenCalled();
  await request(app)
    .post('/payouts')
    .set('Cookie', cookie)
    .set('Idempotency-Key', 'k')
    .send(body)
    .expect(201);
  expect(paymentClient.createPayout).toHaveBeenCalledWith(
    expect.objectContaining({ merchantId: 'm1' }),
  );
});
test('merchant owner is the signed-in user regardless of supplied body/header owner', async () => {
  const { app, cookie, merchantService } = setup();
  await request(app)
    .post('/merchants')
    .set('Cookie', cookie)
    .set('X-Merchant-Id', 'victim')
    .send({ name: 'Store', defaultCurrency: 'USD', ownerUserId: 'victim' })
    .expect(201);
  expect(merchantService.create).toHaveBeenCalledWith({
    name: 'Store',
    defaultCurrency: 'USD',
    ownerUserId: 'u1',
  });
});
test('public catalog works without authentication or headers', async () => {
  await request(setup().app).get('/products').expect(200);
});
test('disabled store blocks resource-based admin reads', async () => {
  const { app, cookie } = setup({ inactive: true });
  await request(app).get('/products/p1').set('Cookie', cookie).expect(403);
});
test('session alone cannot call raw-price integration checkout', async () => {
  const { app, cookie, checkoutService } = setup();
  await request(app)
    .post('/checkout/sessions')
    .set('Cookie', cookie)
    .send({})
    .expect(401);
  expect(checkoutService.createSession).not.toHaveBeenCalled();
});
test('prototype property is not an API key', async () => {
  await request(setup().app)
    .post('/checkout/sessions')
    .set('X-Api-Key', 'toString')
    .send({})
    .expect(401);
});

test.each(['/refunds', '/payouts'])(
  'buyer cannot perform financial mutation %s',
  async (path) => {
    const { app, cookie, paymentClient } = setup({ role: 'buyer' });
    await request(app)
      .post(path)
      .set('Cookie', cookie)
      .set('Idempotency-Key', 'key')
      .send({ paymentId: 'p1', amount: 100, currency: 'USD' })
      .expect(403);
    expect(paymentClient.createRefund).not.toHaveBeenCalled();
    expect(paymentClient.createPayout).not.toHaveBeenCalled();
  },
);
test('buyer cannot read merchant balance', async () => {
  const { app, cookie } = setup({ role: 'buyer' });
  await request(app)
    .get('/merchants/m1/balance')
    .set('Cookie', cookie)
    .expect(403);
});
