const express = require('express');
const { AppError } = require('../middlewares/error.middleware');
const {
  requireUser,
  requireStoreAdmin,
} = require('../services/resource-access');
const { createMerchantContext } = require('../services/merchant-context');
const { createLogger } = require('../middlewares/logger');
const { createErrorHandler } = require('../middlewares/error.middleware');
const { createOrdersRoute } = require('../routes/orders.route');
const { createDocsRoute } = require('../routes/docs.route');
const { createCheckoutRoute } = require('../routes/checkout.route');
const { createPaymentRoute } = require('../routes/payment.route');
const { createRefundRoute } = require('../routes/refund.route');
const { createBalanceRoute } = require('../routes/balance.route');
const { createPayoutRoute } = require('../routes/payout.route');
const { createRateLimiter } = require('../middlewares/rate-limiter');
const { createAuthRoute } = require('../routes/auth.route');
const { createCatalogRoute } = require('../routes/catalog.route');
const { createCommerceRoute } = require('../routes/commerce.route');
const { createCartRoute } = require('../routes/cart.route');

/**
 * Creates the Express application for the orders service.
 *
 * @param {{ orderService: { createOrder: Function }, logger?: object }} dependencies - Application dependencies.
 * @returns {import('express').Express} Configured Express application.
 */
function createApp({
  orderService,
  checkoutService = { createSession: async () => ({}) },
  paymentClient = { getPayment: async () => ({}) },
  logger = createLogger({ service: 'orders-service' }),
  rateLimiter = createRateLimiter(),
  merchantAuth,
  sessionAuth,
  authService,
  catalogService,
  catalogRepository,
  cartService,
  commercialOrderService,
  inventoryService,
  commerceRepository,
  storefrontMerchantId = 'merchant-123',
  cartCreationService,
}) {
  const app = express();
  const merchantContext = createMerchantContext({ storefrontMerchantId });
  app.use((req, res, next) => {
    req.storefrontMerchantId = storefrontMerchantId;
    next();
  });
  const guard = (fn) => async (req, res, next) => {
    try {
      await fn(req, res);
      next();
    } catch (error) {
      next(error);
    }
  };

  app.use((request, response, next) => {
    if (!Buffer.isBuffer(request.body) || request.body.length === 0) {
      next();
      return;
    }

    try {
      request.body = JSON.parse(request.body.toString('utf8'));
      next();
    } catch (error) {
      next(new Error('Invalid JSON body'));
    }
  });
  app.use(express.json());
  app.use(rateLimiter);
  if (authService) app.use(createAuthRoute({ authService, sessionAuth }));
  if (sessionAuth) app.use(sessionAuth);
  // API keys authenticate server integrations only; a supplied merchant header grants nothing.
  if (merchantAuth)
    app.use((req, res, next) =>
      req.get('X-Api-Key') &&
      (/^\/payments\//.test(req.path) ||
        ['/checkout/sessions', '/orders'].includes(req.path))
        ? merchantAuth(req, res, next)
        : next(),
    );
  app.post(
    '/merchants',
    guard(async (req) => {
      await merchantContext.resolveAdmin(req);
      throw new AppError(
        'Single-store mode: merchant creation is disabled',
        409,
        'SINGLE_STORE_MODE',
      );
    }),
  );
  const integrationOnly = guard(async (req) => {
    if (!req.integrationMerchantId)
      throw new AppError('Integration API key required', 401, 'UNAUTHORIZED');
  });
  app.post('/checkout/sessions', integrationOnly);
  app.post('/orders', integrationOnly);
  app.get(
    ['/merchants/:merchantId/balance', '/admin/balance'],
    guard(async (req) => {
      const id = req.params.merchantId || storefrontMerchantId;
      await requireStoreAdmin(req, id);
      req.merchantId = id;
    }),
  );
  app.post(
    '/refunds',
    guard(async (req) => {
      requireUser(req);
      if (typeof req.body?.paymentId !== 'string' || !req.body.paymentId.trim())
        throw new AppError('Payment ID required', 400, 'INVALID_REFUND');
      const payment = await paymentClient.getPayment(req.body.paymentId);
      if (!payment) throw new AppError('Payment not found', 404, 'NOT_FOUND');
      await requireStoreAdmin(req, payment.merchantId);
      req.merchantId = payment.merchantId;
    }),
  );
  app.post(
    '/payouts',
    guard(async (req) => {
      req.merchantId = await merchantContext.resolveAdmin(req);
    }),
  );
  app.post(
    ['/products', '/categories'],
    guard(async (req) => {
      req.merchantId = await merchantContext.resolveAdmin(req);
    }),
  );
  app.get(
    ['/products', '/categories'],
    guard(async (req) => {
      req.merchantId =
        req.query.includeInactive === 'true'
          ? await merchantContext.resolveAdmin(req)
          : await merchantContext.resolveStorefront(req);
    }),
  );
  app.post(
    '/carts',
    guard(async (req) => {
      requireUser(req);
      req.merchantId = await merchantContext.resolveStorefront(req);
      if (req.body?.merchantId && req.body.merchantId !== req.merchantId)
        throw new AppError(
          'Cart merchant does not match storefront',
          400,
          'INVALID_MERCHANT',
        );
    }),
  );
  app.get('/', (request, response) => response.redirect('/docs/'));
  app.use('/docs', createDocsRoute());
  app.use(createCheckoutRoute({ checkoutService }));
  app.use(createPaymentRoute({ paymentClient }));
  app.use(createRefundRoute({ paymentClient }));
  app.use(createBalanceRoute({ paymentClient }));
  app.use(createPayoutRoute({ paymentClient }));
  if (catalogService) {
    app.use(
      createCatalogRoute({
        catalogService,
        catalogRepository: catalogRepository || {
          listProducts: async () => [],
          listCategories: async () => [],
        },
      }),
    );
  }
  if (
    commerceRepository ||
    cartService ||
    commercialOrderService ||
    inventoryService
  ) {
    app.use(
      createCommerceRoute({
        cartService: cartService || { addItem: async () => ({}) },
        orderService: commercialOrderService || {
          createFromCart: async () => ({}),
        },
        inventoryService: inventoryService || { reserve: async () => ({}) },
        repository: commerceRepository || {
          getCart: async () => undefined,
          getCartItems: async () => [],
          listOrdersByUser: async () => [],
        },
      }),
    );
  }
  if (cartCreationService || cartService?.create) {
    app.use(
      createCartRoute({
        cartCreationService: cartCreationService || cartService,
      }),
    );
  }
  app.use(createOrdersRoute({ orderService }));
  app.use(createErrorHandler({ logger }));

  return app;
}

module.exports = {
  createApp,
};
