const serverless = require('serverless-http');
const { createApp } = require('./app');
const { createLogger } = require('../middlewares/logger');
const { AppError } = require('../middlewares/error.middleware');

/**
 * Creates a Lambda handler from an Express application.
 *
 * @param {{ app: import('express').Express }} dependencies - Express application.
 * @returns {Function} Lambda-compatible handler.
 */
function createHandler({ app }) {
  return serverless(app);
}

const logger = createLogger({ service: 'orders-service' });
const orderService = {
  async createOrder() {
    throw new AppError(
      'Order processing is not configured',
      501,
      'ORDER_SERVICE_NOT_CONFIGURED'
    );
  }
};
const app = createApp({ orderService, logger });

module.exports = {
  createHandler,
  handler: createHandler({ app })
};
