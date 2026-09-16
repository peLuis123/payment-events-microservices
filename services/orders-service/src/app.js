const express = require('express');
const { createLogger } = require('../middlewares/logger');
const { createErrorHandler } = require('../middlewares/error.middleware');
const { createOrdersRoute } = require('../routes/orders.route');

/**
 * Creates the Express application for the orders service.
 *
 * @param {{ orderService: { createOrder: Function }, logger?: object }} dependencies - Application dependencies.
 * @returns {import('express').Express} Configured Express application.
 */
function createApp({ orderService, logger = createLogger({ service: 'orders-service' }) }) {
  const app = express();

  app.use(express.json());
  app.use(createOrdersRoute({ orderService }));
  app.use(createErrorHandler({ logger }));

  return app;
}

module.exports = {
  createApp
};
