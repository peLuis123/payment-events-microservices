const express = require('express');
const { createLogger } = require('../middlewares/logger');
const { createErrorHandler } = require('../middlewares/error.middleware');
const { createOrdersRoute } = require('../routes/orders.route');
const { createDocsRoute } = require('../routes/docs.route');

/**
 * Creates the Express application for the orders service.
 *
 * @param {{ orderService: { createOrder: Function }, logger?: object }} dependencies - Application dependencies.
 * @returns {import('express').Express} Configured Express application.
 */
function createApp({ orderService, logger = createLogger({ service: 'orders-service' }) }) {
  const app = express();

  app.use((request, response, next) => {
    if (!Buffer.isBuffer(request.body) || request.body.length === 0) {
      next();
      return;
    }

    try {
      request.body = JSON.parse(request.body.toString('utf8'));
      next();
    } catch (error) {
      next(new Error('Invalid JSON body'));
    }
  });
  app.use(express.json());
  app.get('/', (request, response) => response.redirect('/docs/'));
  app.use('/docs', createDocsRoute());
  app.use(createOrdersRoute({ orderService }));
  app.use(createErrorHandler({ logger }));

  return app;
}

module.exports = {
  createApp
};
