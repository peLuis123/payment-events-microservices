const { verifyStripeSignature, mapStripeEvent } = require('../services/stripe.webhook');
const { verifyPayPalWebhook, mapPayPalEvent } = require('../services/paypal.webhook');

describe('provider sandbox flows', () => {
  test('processes a Stripe sandbox success event', () => {
    const event = {
      id: 'evt_sandbox_stripe',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_sandbox', metadata: { orderId: 'order-sandbox' } } }
    };
    const payload = JSON.stringify(event);
    const timestamp = Math.floor(Date.now() / 1000);
    const crypto = require('node:crypto');
    const signature = `t=${timestamp},v1=${crypto.createHmac('sha256', 'whsec_test').update(`${timestamp}.${payload}`).digest('hex')}`;

    expect(mapStripeEvent(verifyStripeSignature(payload, signature, 'whsec_test'))).toMatchObject({
      provider: 'stripe',
      eventType: 'payment.approved'
    });
  });

  test('processes a PayPal sandbox capture event with a verified adapter', async () => {
    const event = {
      id: 'WH_sandbox_paypal',
      event_type: 'PAYMENT.CAPTURE.COMPLETED',
      resource: { id: 'capture_sandbox' }
    };
    await expect(verifyPayPalWebhook(event, async () => true)).resolves.toBe(true);
    expect(mapPayPalEvent(event)).toMatchObject({
      provider: 'paypal',
      eventType: 'payment.approved'
    });
  });
});
