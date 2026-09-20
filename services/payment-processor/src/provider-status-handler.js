const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { createPaymentRepository } = require('../repositories/payment.repository');
const { createPaymentStatusService } = require('../services/paymentStatus.service');

function createProviderStatusHandler({ processStatus, logger }) {
  return async function handleProviderStatus(event) {
    for (const record of event.Records || []) {
      const message = JSON.parse(record.Sns.Message);
      if (!message.providerEventId || !message.eventType || !message.data) {
        throw new Error('Invalid provider status event');
      }
      await processStatus(message);
    }

    return { batchItemFailures: [] };
  };
}

function createProductionProviderStatusHandler({ client, tableName = process.env.PAYMENTS_TABLE || 'Payments' } = {}) {
  const dynamodb = client || DynamoDBDocumentClient.from(
    new DynamoDBClient({ region: process.env.AWS_REGION })
  );
  const repository = createPaymentRepository({ client: dynamodb, tableName });
  const service = createPaymentStatusService({ savePayment: repository.save });
  return createProviderStatusHandler({ processStatus: service.process });
}

let productionHandler;

async function handler(event, context) {
  productionHandler ??= createProductionProviderStatusHandler();
  return productionHandler(event, context);
}

module.exports = { createProviderStatusHandler, createProductionProviderStatusHandler, handler };
