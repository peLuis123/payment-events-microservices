const express = require('express');

function createPaymentInternalRoute({ getPayment = async () => undefined }) {
  const router = express.Router();

  router.get('/internal/payments/:paymentId', async (request, response, next) => {
    try {
      if (request.get('X-Internal-Service') !== 'orders-service') {
        response.status(401).json({ error: 'Unauthorized internal service' });
        return;
      }

      const payment = await getPayment(request.params.paymentId);
      if (!payment) {
        response.status(404).json({ error: 'Payment not found', code: 'PAYMENT_NOT_FOUND' });
        return;
      }
      response.status(200).json(payment);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createPaymentInternalRoute };
