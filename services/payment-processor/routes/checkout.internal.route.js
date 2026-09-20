const express = require('express');

function createCheckoutInternalRoute({ checkoutProcessor }) {
  const router = express.Router();

  router.post('/internal/checkout/sessions', async (request, response, next) => {
    try {
      if (request.get('X-Internal-Service') !== 'orders-service') {
        response.status(401).json({ error: 'Unauthorized internal service' });
        return;
      }

      const result = await checkoutProcessor.createCheckout({
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

module.exports = { createCheckoutInternalRoute };
