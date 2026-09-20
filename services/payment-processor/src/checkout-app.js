const express = require('express');
const { createCheckoutInternalRoute } = require('../routes/checkout.internal.route');
const { createPaymentInternalRoute } = require('../routes/payment.internal.route');
const { createRefundInternalRoute } = require('../routes/refund.internal.route');
const { createCheckoutProcessor } = require('../services/checkout.processor');

/**
 * Creates the internal checkout application from provider adapters.
 *
 * @param {{ providers: object }} dependencies - Stripe and PayPal adapters.
 * @returns {import('express').Express} Checkout application.
 */
function createCheckoutApp({ providers, savePendingPayment, getPayment, refund }) {
  const app = express();
  app.use((request, response, next) => {
    const bodyBuffer = Buffer.isBuffer(request.body)
      ? request.body
      : request.body?.type === 'Buffer' && Array.isArray(request.body.data)
        ? Buffer.from(request.body.data)
        : null;

    if (!bodyBuffer || bodyBuffer.length === 0) {
      next();
      return;
    }

    try {
      request.body = JSON.parse(bodyBuffer.toString('utf8'));
      next();
    } catch (error) {
      next(error);
    }
  });
  app.use(express.json());
  app.use(createCheckoutInternalRoute({
    checkoutProcessor: createCheckoutProcessor({ providers }),
    savePendingPayment
  }));
  app.use(createPaymentInternalRoute({ getPayment }));
  app.use(createRefundInternalRoute({ refund }));
  app.use((error, request, response, next) => {
    if (response.headersSent) {
      next(error);
      return;
    }
    response.status(error.statusCode || 500).json({
      error: error.message || 'Internal server error',
      ...(error.code ? { code: error.code } : {})
    });
  });
  return app;
}

module.exports = { createCheckoutApp };
