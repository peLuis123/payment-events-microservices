const { createApp } = require('./app');
const { createLogger } = require('../middlewares/logger');
const { AppError } = require('../middlewares/error.middleware');

/**
 * Starts the local Express server.
 *
 * @param {{ app: import('express').Express, port: number, logger: { info: Function } }} options - Server options.
 * @returns {import('http').Server} Running HTTP server.
 */
function startServer({ app, port, logger }) {
  return app.listen(port, () => {
    logger.info({ port }, 'Orders service is running');
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  const logger = createLogger({ service: 'orders-service', pretty: true });
  const orderService = {
    async createOrder() {
      throw new AppError(
        'Order processing is not configured locally',
        501,
        'ORDER_SERVICE_NOT_CONFIGURED'
      );
    }
  };

  startServer({
    app: createApp({ orderService, logger }),
    port,
    logger
  });
}

module.exports = {
  startServer
};
