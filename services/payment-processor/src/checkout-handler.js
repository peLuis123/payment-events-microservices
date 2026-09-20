const serverless = require('serverless-http');
const { createCheckoutApp } = require('./checkout-app');
const { createStripeCheckout } = require('../services/stripe.checkout');
const { createPayPalCheckout } = require('../services/paypal.checkout');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { createPaymentRepository } = require('../repositories/payment.repository');
const { createRefundRepository } = require('../repositories/refund.repository');
const { createRefundService } = require('../services/refund.service');

/**
 * Creates a Lambda handler for synchronous checkout sessions.
 *
 * @param {{ app: import('express').Express }} dependencies - Checkout app.
 * @returns {Function} Lambda-compatible checkout handler.
 */
function createCheckoutHandler({ app }) {
  return serverless(app);
}

function createProductionCheckoutHandler({ stripe, paypal, client, savePendingPayment } = {}) {
  const dynamodb = client || DynamoDBDocumentClient.from(
    new DynamoDBClient({ region: process.env.AWS_REGION })
  );
  const paymentRepository = createPaymentRepository({
    client: dynamodb,
    tableName: process.env.PAYMENTS_TABLE || 'Payments'
  });
  const refundRepository = createRefundRepository({
    client: dynamodb,
    tableName: process.env.REFUNDS_TABLE || 'Refunds'
  });
  const providers = {
    stripe: stripe || createStripeCheckout({ secretKey: process.env.STRIPE_SECRET_KEY }),
    paypal: paypal || createPayPalCheckout({
      clientId: process.env.PAYPAL_CLIENT_ID,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET,
      apiBaseUrl: process.env.PAYPAL_ENVIRONMENT === 'production'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com'
    })
  };
  const refundService = createRefundService({
    getPayment: paymentRepository.get,
    savePayment: paymentRepository.save,
    getRefund: refundRepository.get,
    saveRefund: refundRepository.save,
    providers
  });
  const app = createCheckoutApp({
    providers,
    savePendingPayment: savePendingPayment || paymentRepository.save,
    getPayment: paymentRepository.get,
    refund: refundService.refund
  });
  return createCheckoutHandler({ app });
}

let productionHandler;

async function handler(event, context) {
  productionHandler ??= createProductionCheckoutHandler();
  return productionHandler(event, context);
}

module.exports = { createCheckoutHandler, createProductionCheckoutHandler, handler };
