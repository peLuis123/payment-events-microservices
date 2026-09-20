const request = require('supertest');
const express = require('express');
const { createCheckoutInternalRoute } = require('../routes/checkout.internal.route');
const { createCheckoutApp } = require('../src/checkout-app');

describe('POST /internal/checkout/sessions', () => {
  test('returns a provider checkout session', async () => {
    const checkoutProcessor = {
      createCheckout: jest.fn().mockResolvedValue({
        checkoutId: 'checkout-stripe-123',
        checkoutUrl: 'https://checkout.stripe.test/session-123',
        paymentId: 'payment-stripe-123',
        status: 'pending'
      })
    };
    const app = express();
    app.use(express.json());
    app.use(createCheckoutInternalRoute({ checkoutProcessor }));

    const response = await request(app)
      .post('/internal/checkout/sessions')
      .set('X-Internal-Service', 'orders-service')
      .set('Idempotency-Key', 'checkout-123')
      .send({ paymentProvider: 'stripe', currency: 'USD' });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      checkoutId: 'checkout-stripe-123',
      status: 'pending'
    });
    expect(checkoutProcessor.createCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentProvider: 'stripe',
        idempotencyKey: 'checkout-123'
      })
    );
  });

  test('persists the payment as pending after creating the provider session', async () => {
    const checkoutProcessor = {
      createCheckout: jest.fn().mockResolvedValue({
        checkoutId: 'checkout-paypal-123',
        checkoutUrl: 'https://paypal.test/checkout',
        paymentId: 'paypal-order-123'
      })
    };
    const savePendingPayment = jest.fn().mockResolvedValue({ status: 'saved' });
    const app = express();
    app.use(express.json());
    app.use(createCheckoutInternalRoute({ checkoutProcessor, savePendingPayment }));

    await request(app)
      .post('/internal/checkout/sessions')
      .set('X-Internal-Service', 'orders-service')
      .set('Idempotency-Key', 'checkout-paypal-123')
      .send({
        paymentProvider: 'paypal',
        currency: 'USD',
        externalReference: 'order-123',
        merchantId: 'merchant-123',
        items: [{ productId: 'product-123', quantity: 1, unitAmount: 5799 }]
      });

    expect(savePendingPayment).toHaveBeenCalledWith({
      paymentId: 'paypal-order-123',
      orderId: 'order-123',
      provider: 'paypal',
      providerEventId: 'checkout-paypal-123',
      status: 'pending',
      amount: 5799,
      currency: 'USD'
    });
  });

});
