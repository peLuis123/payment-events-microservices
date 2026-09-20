const express = require('express');
const { createCheckoutInternalRoute } = require('../routes/checkout.internal.route');
const { createCheckoutProcessor } = require('../services/checkout.processor');

/**
 * Creates the internal checkout application from provider adapters.
 *
 * @param {{ providers: object }} dependencies - Stripe and PayPal adapters.
 * @returns {import('express').Express} Checkout application.
 */
function createCheckoutApp({ providers }) {
  const app = express();
  app.use(express.json());
  app.use(createCheckoutInternalRoute({
    checkoutProcessor: createCheckoutProcessor({ providers })
  }));
  return app;
}

module.exports = { createCheckoutApp };
