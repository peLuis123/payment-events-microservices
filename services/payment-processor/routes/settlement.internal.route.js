const express = require('express');

function createSettlementInternalRoute({ settle = async () => undefined }) {
  const router = express.Router();
  router.post('/internal/settlements', async (request, response, next) => {
    try {
      if (request.get('X-Internal-Service') !== 'orders-service') {
        response.status(401).json({ error: 'Unauthorized internal service' });
        return;
      }
      response.status(201).json(await settle(request.body));
    } catch (error) {
      next(error);
    }
  });
  return router;
}

module.exports = { createSettlementInternalRoute };
