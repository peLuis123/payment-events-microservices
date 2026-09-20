const express = require('express');

function createCheckoutInternalRoute({ checkoutProcessor, savePendingPayment = async () => undefined }) {
  const router = express.Router();

  router.post('/internal/checkout/sessions', async (request, response, next) => {
    try {
      if (request.get('X-Internal-Service') !== 'orders-service') {
        response.status(401).json({ error: 'Unauthorized internal service' });
        return;
      }

      const checkoutRequest = {
        ...request.body,
        idempotencyKey: request.get('Idempotency-Key')
      };
      const result = await checkoutProcessor.createCheckout(checkoutRequest);
      const amount = checkoutRequest.items?.reduce(
        (total, item) => total + item.unitAmount * item.quantity,
        0
      );
      await savePendingPayment({
        paymentId: result.paymentId || result.checkoutId,
        providerTransactionId: result.providerTransactionId,
        orderId: checkoutRequest.externalReference,
        provider: checkoutRequest.paymentProvider,
        merchantId: checkoutRequest.merchantId,
        providerEventId: checkoutRequest.idempotencyKey,
        status: 'pending',
        amount,
        currency: checkoutRequest.currency
      });
      response.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createCheckoutInternalRoute };
