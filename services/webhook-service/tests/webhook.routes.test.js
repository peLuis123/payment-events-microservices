const request = require('supertest');
const { createApp } = require('../src/app');

describe('provider webhook routes', () => {
  test('accepts a verified PayPal webhook and publishes the mapped event', async () => {
    const processWebhook = jest.fn().mockResolvedValue(undefined);
    const app = createApp({
      verifyPayPal: jest.fn().mockResolvedValue(true),
      mapPayPalEvent: jest.fn().mockReturnValue({ eventType: 'payment.approved' }),
      processWebhook,
      logger: { warn: jest.fn(), error: jest.fn() }
    });

    const response = await request(app)
      .post('/webhooks/paypal')
      .set('PAYPAL-TRANSMISSION-ID', 'transmission-123')
      .set('PAYPAL-TRANSMISSION-SIG', 'signature-123')
      .send({
        id: 'WH-123',
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: { id: 'capture-123' }
      });

    expect(response.status).toBe(202);
    expect(response.body).toEqual({ received: true });
    expect(processWebhook).toHaveBeenCalledWith({ eventType: 'payment.approved' });
  });

  test('accepts a verified Stripe webhook using the raw request body', async () => {
    const processWebhook = jest.fn().mockResolvedValue(undefined);
    const app = createApp({
      verifyStripe: jest.fn().mockReturnValue({ id: 'evt-123' }),
      mapStripeEvent: jest.fn().mockReturnValue({ eventType: 'payment.approved' }),
      processWebhook,
      logger: { warn: jest.fn(), error: jest.fn() }
    });

    const response = await request(app)
      .post('/webhooks/stripe')
      .set('Stripe-Signature', 't=123,v1=signature')
      .send({ id: 'evt-123', type: 'payment_intent.succeeded', data: { object: {} } });

    expect(response.status).toBe(202);
    expect(processWebhook).toHaveBeenCalledWith({ eventType: 'payment.approved' });
  });
});
