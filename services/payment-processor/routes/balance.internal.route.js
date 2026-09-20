const express = require('express');

function createBalanceInternalRoute({ getBalance = async () => undefined }) {
  const router = express.Router();

  router.get('/internal/balances/:merchantId', async (request, response, next) => {
    try {
      if (request.get('X-Internal-Service') !== 'orders-service') {
        response.status(401).json({ error: 'Unauthorized internal service' });
        return;
      }
      const balance = await getBalance(request.params.merchantId);
      response.status(200).json(balance || {
        merchantId: request.params.merchantId,
        available: 0,
        pending: 0,
        currency: 'USD'
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createBalanceInternalRoute };
