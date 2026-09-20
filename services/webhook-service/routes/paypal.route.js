const express = require('express');

/**
 * Creates the PayPal webhook route.
 *
 * @param {{ verifyPayPal: Function, mapPayPalEvent: Function, processWebhook: Function, logger?: object }} dependencies - Route dependencies.
 * @returns {import('express').Router} PayPal router.
 */
function createPayPalRoute ({ verifyPayPal, mapPayPalEvent, processWebhook, logger }) {
  const router = express.Router();
  router.post('/', express.json(), (request, response, next) => {
    if (Buffer.isBuffer(request.body)) {
      try {
        request.body = JSON.parse(request.body.toString('utf8'));
      } catch (error) {
        next(error);
        return;
      }
    }
    next();
  }, async (request, response, next) => {
    try {
      const body = request.body;
      logger?.info({
        contentType: request.get('content-type'),
        bodyType: typeof body,
        bodyKeys: body && typeof body === 'object' ? Object.keys(body) : [],
        eventType: body?.event_type || body?.eventType || body?.type || null
      }, 'PayPal webhook received');

      await verifyPayPal({
        transmissionId: request.get('PAYPAL-TRANSMISSION-ID'),
        transmissionSignature: request.get('PAYPAL-TRANSMISSION-SIG'),
        transmissionTime: request.get('PAYPAL-TRANSMISSION-TIME'),
        certUrl: request.get('PAYPAL-CERT-URL'),
        authAlgo: request.get('PAYPAL-AUTH-ALGO'),
        body
      });
      await processWebhook(mapPayPalEvent(body));
      response.status(202).json({ received: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createPayPalRoute };
