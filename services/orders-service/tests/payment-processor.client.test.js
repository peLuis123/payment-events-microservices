const { createPaymentProcessorClient } = require('../clients/payment-processor.client');

describe('createPaymentProcessorClient', () => {
  test('creates a checkout session through the processor internal endpoint', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        checkoutId: 'checkout-123',
        checkoutUrl: 'https://checkout.stripe.test/session-123',
        paymentId: 'payment-123'
      })
    });
    const client = createPaymentProcessorClient({
      baseUrl: 'https://processor.example.com',
      fetchImpl
    });
    const request = {
      paymentProvider: 'stripe',
      items: [{ productId: 'product-123', quantity: 1, unitAmount: 4999 }],
      currency: 'USD',
      successUrl: 'https://frontend.test/success',
      cancelUrl: 'https://frontend.test/cancel',
      externalReference: 'cart-123',
      merchantId: 'merchant-123',
      idempotencyKey: 'checkout-request-123'
    };

    await expect(client.createCheckout(request)).resolves.toEqual({
      checkoutId: 'checkout-123',
      checkoutUrl: 'https://checkout.stripe.test/session-123',
      paymentId: 'payment-123'
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://processor.example.com/internal/checkout/sessions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Internal-Service': 'orders-service',
          'Idempotency-Key': 'checkout-request-123'
        }),
        body: JSON.stringify(request)
      })
    );
  });

  test('throws the processor error response', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ error: 'Checkout provider unavailable' })
    });
    const client = createPaymentProcessorClient({
      baseUrl: 'https://processor.example.com',
      fetchImpl
    });

    await expect(client.createCheckout({ idempotencyKey: 'request-123' }))
      .rejects.toThrow('Checkout provider unavailable');
  });
});
