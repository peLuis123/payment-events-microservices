const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { createPaymentRepository } = require('../repositories/payment.repository');
const { createPaymentStatusService } = require('../services/paymentStatus.service');
const { createProviderApprovalHandler } = require('../services/paypal.approval.service');
const { createPayPalCheckout } = require('../services/paypal.checkout');

function createProviderStatusHandler({ processStatus, processApproval = async () => undefined, logger }) {
  return async function handleProviderStatus(event) {
    for (const record of event.Records || []) {
      const message = JSON.parse(record.Sns.Message);
      if (!message.providerEventId || !message.eventType || !message.data) {
        throw new Error('Invalid provider status event');
      }
      await processStatus(message);
      await processApproval(message);
    }

    return { batchItemFailures: [] };
  };
}

function createProductionProviderStatusHandler({
  client,
  paypal,
  tableName = process.env.PAYMENTS_TABLE || 'Payments'
} = {}) {
  const dynamodb = client || DynamoDBDocumentClient.from(
    new DynamoDBClient({ region: process.env.AWS_REGION })
  );
  const repository = createPaymentRepository({ client: dynamodb, tableName });
  const service = createPaymentStatusService({ savePayment: repository.save });
  const paypalCheckout = paypal || createPayPalCheckout({
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    apiBaseUrl: process.env.PAYPAL_ENVIRONMENT === 'production'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com'
  });
  const approvalService = createProviderApprovalHandler({
    captureOrder: paypalCheckout.captureOrder
  });
  return createProviderStatusHandler({
    processStatus: service.process,
    processApproval: approvalService
  });
}

let productionHandler;

async function handler(event, context) {
  productionHandler ??= createProductionProviderStatusHandler();
  return productionHandler(event, context);
}

module.exports = { createProviderStatusHandler, createProductionProviderStatusHandler, handler };
