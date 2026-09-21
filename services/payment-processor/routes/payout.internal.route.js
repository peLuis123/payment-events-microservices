const express = require('express');

function createPayoutInternalRoute({ create = async () => undefined }) {
  const router = express.Router();
  router.post('/internal/payouts', async (request, response, next) => {
    try {
      if (request.get('X-Internal-Service') !== 'orders-service') {
        response.status(401).json({ error: 'Unauthorized internal service' });
        return;
      }
      const result = await create(request.body);
      response.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });
  return router;
}

module.exports = { createPayoutInternalRoute };
