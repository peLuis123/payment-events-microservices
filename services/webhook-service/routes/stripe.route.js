const express = require('express');

/**
 * Creates the Stripe webhook route.
 *
 * @param {{ verifyStripe: Function, mapStripeEvent: Function, processWebhook: Function }} dependencies - Route dependencies.
 * @returns {import('express').Router} Stripe router.
 */
function createStripeRoute({ verifyStripe, mapStripeEvent, processWebhook }) {
  const router = express.Router();

  router.post('/', express.raw({ type: 'application/json' }), async (request, response, next) => {
    try {
      const payload = request.body.toString('utf8');
      const stripeEvent = verifyStripe(payload, request.get('Stripe-Signature'));
      const mappedEvent = mapStripeEvent(stripeEvent);
      if (mappedEvent) {
        await processWebhook(mappedEvent);
      }
      response.status(202).json({ received: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createStripeRoute };
