const crypto = require('node:crypto');
const { verifyStripeSignature, mapStripeEvent } = require('../services/stripe.webhook');

describe('Stripe webhook adapter', () => {
  const secret = 'whsec_test';
  const payload = JSON.stringify({ id: 'evt_123', type: 'payment_intent.succeeded', data: { object: { id: 'pi_123', metadata: { orderId: 'order-123' }, amount: 4999, currency: 'usd' } } });

  function signature(timestamp) {
    const digest = crypto.createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');
    return `t=${timestamp},v1=${digest}`;
  }

  test('accepts a valid signature within tolerance', () => {
    const timestamp = Math.floor(Date.now() / 1000);
    expect(verifyStripeSignature(payload, signature(timestamp), secret)).toEqual({
      id: 'evt_123',
      type: 'payment_intent.succeeded',
      data: expect.any(Object)
    });
  });

  test('rejects an invalid or expired signature', () => {
    expect(() => verifyStripeSignature(payload, 't=1,v1=bad', secret)).toThrow();
  });

  test('maps payment succeeded, failed, refunded and disputed events', () => {
    expect(mapStripeEvent({ id: 'evt_123', type: 'payment_intent.succeeded', data: { object: { id: 'pi_123', metadata: { orderId: 'order-123' } } } }).eventType).toBe('payment.approved');
    expect(mapStripeEvent({ id: 'evt_123', type: 'payment_intent.payment_failed', data: { object: { metadata: { orderId: 'order-123' } } } }).eventType).toBe('payment.rejected');
    expect(mapStripeEvent({ id: 'evt_123', type: 'charge.refunded', data: { object: { metadata: { orderId: 'order-123' } } } }).eventType).toBe('payment.refunded');
    expect(mapStripeEvent({ id: 'evt_123', type: 'charge.dispute.created', data: { object: { metadata: { orderId: 'order-123' } } } }).eventType).toBe('payment.disputed');
  });

  test('ignores valid but unhandled Stripe events', () => {
    expect(mapStripeEvent({ id: 'evt_ignored', type: 'charge.updated', data: { object: {} } })).toBeNull();
  });
});
