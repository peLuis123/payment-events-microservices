const { SQSClient } = require('@aws-sdk/client-sqs');
const serverless = require('serverless-http');
const { createApp } = require('./app');
const { createLogger } = require('../middlewares/logger');
const { createOrderService } = require('../services/order.service');
const { createSqsRepository } = require('../repositories/sqs.repository');
const { loadEnvironment } = require('../validators/env.validator');
const { createCheckoutService } = require('../services/checkout.service');
const { createPaymentProcessorClient } = require('../clients/payment-processor.client');
const { createMerchantAuth, parseMerchantKeys } = require('../middlewares/merchant-auth');
const { createRateLimiter } = require('../middlewares/rate-limiter');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { createUserRepository } = require('../repositories/user.repository');
const { createCatalogRepository } = require('../repositories/catalog.repository');
const { createCatalogService } = require('../services/catalog.service');
const { createMerchantService } = require('../services/merchant.service');
const { createMerchantRepository } = require('../repositories/merchant.repository');
const { createSessionAuth } = require('../middlewares/session-auth');
const { createAuthService } = require('../services/auth.service');

/**
 * Creates a Lambda handler from an Express application.
 *
 * @param {{ app: import('express').Express }} dependencies - Express application.
 * @returns {Function} Lambda-compatible handler.
 */
function createHandler({ app }) {
  return serverless(app);
}

/**
 * Composes the production handler and its AWS dependencies.
 *
 * @param {{ environment?: NodeJS.ProcessEnv, client?: object, fetchImpl?: Function, logger?: object, createEventId?: Function, createCheckoutId?: Function, createPaymentId?: Function, now?: Function }} dependencies - Runtime dependencies.
 * @returns {Function} Lambda-compatible production handler.
 */
function createProductionHandler({
  environment = process.env,
  client,
  fetchImpl,
  logger = createLogger({ service: 'orders-service' }),
  createEventId,
  createCheckoutId,
  createPaymentId,
  now
} = {}) {
  const config = loadEnvironment(environment);
  const sqsClient = client || new SQSClient({ region: config.AWS_REGION });
  const repository = createSqsRepository({
    client: sqsClient,
    queueUrl: config.SQS_QUEUE_URL
  });
  const orderService = createOrderService({
    publishEvent: repository.publish,
    createEventId,
    now
  });
  const checkoutService = createCheckoutService({
    createCheckoutId,
    createPaymentId,
    provider: createPaymentProcessorClient({
      baseUrl: config.PAYMENT_PROCESSOR_CHECKOUT_URL,
      fetchImpl
    })
  });
  const paymentClient = createPaymentProcessorClient({
    baseUrl: config.PAYMENT_PROCESSOR_CHECKOUT_URL,
    fetchImpl
  });
  const merchantKeys = parseMerchantKeys(environment.MERCHANT_API_KEYS);
  const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: config.AWS_REGION }));
  const userRepository = createUserRepository({
    client: dynamodb,
    tableName: environment.USERS_TABLE || 'Users',
    refreshTableName: environment.REFRESH_TOKENS_TABLE || 'RefreshTokens'
  });
  const authService = createAuthService(userRepository);
  const catalogRepository = createCatalogRepository({
    client: dynamodb,
    productsTable: environment.PRODUCTS_TABLE || 'Products',
    categoriesTable: environment.CATEGORIES_TABLE || 'Categories'
  });
  const catalogService = createCatalogService(catalogRepository);
  const merchantRepository = createMerchantRepository({
    client: dynamodb,
    merchantsTable: environment.MERCHANTS_TABLE || 'Merchants',
    merchantUsersTable: environment.MERCHANT_USERS_TABLE || 'MerchantUsers'
  });
  const merchantService = createMerchantService(merchantRepository);
  const app = createApp({
    orderService,
    checkoutService,
    paymentClient,
    logger,
    merchantAuth: Object.keys(merchantKeys).length
      ? createMerchantAuth({ keys: merchantKeys })
      : undefined,
    sessionAuth: createSessionAuth({
      secret: environment.AUTH_TOKEN_SECRET,
      optional: true
    }),
    authService,
    catalogService,
    catalogRepository,
    merchantService,
    rateLimiter: createRateLimiter({
      windowMs: Number(environment.RATE_LIMIT_WINDOW_MS || 60000),
      max: Number(environment.RATE_LIMIT_MAX || 60)
    })
  });

  return createHandler({ app });
}

let productionHandler;

async function handler(event, context, callback) {
  productionHandler ??= createProductionHandler();
  return productionHandler(event, context, callback);
}

module.exports = {
  createHandler,
  createProductionHandler,
  handler
};
