const request = require('supertest');
const express = require('express');
const { createCheckoutApp } = require('../src/checkout-app');

describe('production checkout composition', () => {
  test('routes a Stripe checkout request to the Stripe adapter', async () => {
    const stripe = {
      createCheckout: jest.fn().mockResolvedValue({
        checkoutId: 'cs_test_123',
        checkoutUrl: 'https://checkout.stripe.test/cs_test_123',
        paymentId: 'pi_test_123',
        status: 'pending'
      })
    };
    const app = createCheckoutApp({ providers: { stripe } });

    const response = await request(app)
      .post('/internal/checkout/sessions')
      .set('X-Internal-Service', 'orders-service')
      .set('Idempotency-Key', 'checkout-123')
      .send({ paymentProvider: 'stripe', currency: 'USD' });

    expect(response.status).toBe(201);
    expect(response.body.checkoutId).toBe('cs_test_123');
    expect(stripe.createCheckout).toHaveBeenCalledTimes(1);
  });
});
