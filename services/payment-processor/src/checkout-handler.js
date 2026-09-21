const serverless = require('serverless-http');
const { createCheckoutApp } = require('./checkout-app');
const { createStripeCheckout } = require('../services/stripe.checkout');
const { createPayPalCheckout } = require('../services/paypal.checkout');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { createPaymentRepository } = require('../repositories/payment.repository');
const { createRefundRepository } = require('../repositories/refund.repository');
const { createRefundService } = require('../services/refund.service');
const { createAccountingRepository } = require('../repositories/accounting.repository');
const { createLedgerService } = require('../services/ledger.service');
const { createBalanceRepository } = require('../repositories/balance.repository');
const { createPayoutRepository } = require('../repositories/payout.repository');
const { createPayoutService } = require('../services/payout.service');
const { createSettlementService } = require('../services/settlement.service');

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
  const accountingRepository = createAccountingRepository({
    client: dynamodb,
    ledgerTableName: process.env.LEDGER_TABLE || 'LedgerEntries',
    balanceTableName: process.env.BALANCES_TABLE || 'Balances'
  });
  const balanceRepository = createBalanceRepository({
    client: dynamodb,
    tableName: process.env.BALANCES_TABLE || 'Balances'
  });
  const payoutRepository = createPayoutRepository({
    client: dynamodb,
    tableName: process.env.PAYOUTS_TABLE || 'Payouts'
  });
  const ledgerService = createLedgerService({
    recordTransaction: accountingRepository.recordTransaction
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
    recordPaymentApproved: ledgerService.recordPaymentApproved,
    recordRefund: ledgerService.recordRefund,
    providers
  });
  const payoutService = createPayoutService({
    getBalance: balanceRepository.get,
    getPayout: payoutRepository.get,
    savePayout: payoutRepository.save,
    updateBalance: balanceRepository.update,
    recordPayout: ledgerService.recordPayout,
    providers
  });
  const settlementService = createSettlementService({
    updateBalance: balanceRepository.update,
    recordSettlement: ledgerService.recordSettlement
  });
  const app = createCheckoutApp({
    providers,
    savePendingPayment: savePendingPayment || paymentRepository.save,
    getPayment: paymentRepository.get,
    refund: refundService.refund,
    getBalance: accountingRepository.getBalance,
    createPayout: payoutService.create,
    settle: settlementService.settle
  });
  return createCheckoutHandler({ app });
}

let productionHandler;

async function handler(event, context) {
  productionHandler ??= createProductionCheckoutHandler();
  return productionHandler(event, context);
}

module.exports = { createCheckoutHandler, createProductionCheckoutHandler, handler };
