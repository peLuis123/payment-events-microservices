const serverless = require('serverless-http');
const { createCheckoutApp } = require('./checkout-app');
const { createStripeCheckout } = require('../services/stripe.checkout');
const { createPayPalCheckout } = require('../services/paypal.checkout');

/**
 * Creates a Lambda handler for synchronous checkout sessions.
 *
 * @param {{ app: import('express').Express }} dependencies - Checkout app.
 * @returns {Function} Lambda-compatible checkout handler.
 */
function createCheckoutHandler({ app }) {
  return serverless(app);
}

function createProductionCheckoutHandler({ stripe, paypal } = {}) {
  const app = createCheckoutApp({
    providers: {
      stripe: stripe || createStripeCheckout({ secretKey: process.env.STRIPE_SECRET_KEY }),
      paypal: paypal || createPayPalCheckout({
        clientId: process.env.PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET,
        apiBaseUrl: process.env.PAYPAL_ENVIRONMENT === 'production'
          ? 'https://api-m.paypal.com'
          : 'https://api-m.sandbox.paypal.com'
      })
    }
  });
  return createCheckoutHandler({ app });
}

let productionHandler;

async function handler(event, context) {
  productionHandler ??= createProductionCheckoutHandler();
  return productionHandler(event, context);
}

module.exports = { createCheckoutHandler, createProductionCheckoutHandler, handler };
