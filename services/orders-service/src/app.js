const express = require('express');
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
const { createMerchantRoute } = require('../routes/merchant.route');
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
  merchantService,
  cartService,
  commercialOrderService,
  inventoryService,
  commerceRepository,
  getMembership,
  cartCreationService,
}) {
  const app = express();

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
  if (merchantAuth)
    app.use((req, res, next) => {
      const commercePath =
        /^\/(carts|commercial-orders|payments)(\/|$)/.test(req.path) ||
        /^\/merchants\/[^/]+\/orders$/.test(req.path);
      const catalogPath = /^\/(products|categories)(\/|$)/.test(req.path);
      if (
        (req.user && (commercePath || catalogPath)) ||
        (req.method === 'GET' &&
          catalogPath &&
          !req.path.endsWith('/inventory'))
      )
        return next();
      return merchantAuth(req, res, next);
    });
  app.get('/', (request, response) => response.redirect('/docs/'));
  app.use('/docs', createDocsRoute());
  app.use(createCheckoutRoute({ checkoutService }));
  app.use(createPaymentRoute({ paymentClient, getMembership }));
  app.use(createRefundRoute({ paymentClient }));
  app.use(createBalanceRoute({ paymentClient }));
  app.use(createPayoutRoute({ paymentClient }));
  if (catalogService) {
    app.use(
      createCatalogRoute({
        catalogService,
        getMembership,
        catalogRepository: catalogRepository || {
          listProducts: async () => [],
          listCategories: async () => [],
        },
      }),
    );
  }
  if (merchantService) app.use(createMerchantRoute({ merchantService }));
  if (
    commerceRepository ||
    cartService ||
    commercialOrderService ||
    inventoryService
  ) {
    app.use(
      createCommerceRoute({
        getMembership,
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
