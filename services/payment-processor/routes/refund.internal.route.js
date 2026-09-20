const express = require('express');

function createRefundInternalRoute({ refund = async () => undefined }) {
  const router = express.Router();

  router.post('/internal/refunds', async (request, response, next) => {
    try {
      if (request.get('X-Internal-Service') !== 'orders-service') {
        response.status(401).json({ error: 'Unauthorized internal service' });
        return;
      }
      const result = await refund({
        ...request.body,
        idempotencyKey: request.get('Idempotency-Key')
      });
      response.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createRefundInternalRoute };
