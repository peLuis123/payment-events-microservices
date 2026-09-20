const { mapStripeEvent } = require('../../webhook-service/services/stripe.webhook');
const { mapPayPalEvent } = require('../../webhook-service/services/paypal.webhook');

describe('provider payment correlation', () => {
  test('uses Stripe payment metadata as the internal payment id', () => {
    const event = mapStripeEvent({
      id: 'evt_123',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_provider_123',
          metadata: { paymentId: 'payment-internal-123', merchantId: 'merchant-123' },
          amount_received: 5799,
          currency: 'usd'
        }
      }
    });

    expect(event.data.providerPaymentId).toBe('payment-internal-123');
    expect(event.data.providerTransactionId).toBe('pi_provider_123');
    expect(event.data.merchantId).toBe('merchant-123');
  });

  test('uses the PayPal order id while retaining the capture id', () => {
    const event = mapPayPalEvent({
      id: 'wh_123',
      event_type: 'PAYMENT.CAPTURE.COMPLETED',
      resource: {
        id: 'capture-123',
        supplementary_data: { related_ids: { order_id: 'order-123' } }
      }
    });

    expect(event.data.providerPaymentId).toBe('order-123');
    expect(event.data.providerTransactionId).toBe('capture-123');
  });
});
