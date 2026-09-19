const express = require('express');

/**
 * Creates the PayPal webhook route.
 *
 * @param {{ verifyPayPal: Function, mapPayPalEvent: Function, processWebhook: Function }} dependencies - Route dependencies.
 * @returns {import('express').Router} PayPal router.
 */
function createPayPalRoute({ verifyPayPal, mapPayPalEvent, processWebhook }) {
  const router = express.Router();

  router.post('/', express.json(), async (request, response, next) => {
    try {
      await verifyPayPal({
        transmissionId: request.get('PAYPAL-TRANSMISSION-ID'),
        transmissionSignature: request.get('PAYPAL-TRANSMISSION-SIG'),
        body: request.body
      });
      await processWebhook(mapPayPalEvent(request.body));
      response.status(202).json({ received: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createPayPalRoute };
