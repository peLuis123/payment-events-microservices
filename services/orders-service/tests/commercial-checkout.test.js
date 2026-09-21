const { createCommercialOrderService } = require('../services/commercial-order.service');

describe('commercial order checkout', () => {
  test('creates a payment checkout linked to the commercial order', async () => {
    const saveOrder = jest.fn().mockResolvedValue(undefined);
    const service = createCommercialOrderService({
      getOrder: jest.fn().mockResolvedValue({ orderId: 'order-123', userId: 'user-123', merchantId: 'merchant-123', total: 5799, currency: 'USD', orderStatus: 'pending' }),
      saveOrder,
      checkoutService: { createSession: jest.fn().mockResolvedValue({ checkoutId: 'checkout-123', checkoutUrl: 'https://checkout.test/123', paymentId: 'payment-123', status: 'pending' }) }
    });

    await expect(service.createCheckout({ orderId: 'order-123', paymentProvider: 'stripe', successUrl: 'https://example.com/s', cancelUrl: 'https://example.com/c', idempotencyKey: 'checkout-order-123' }))
      .resolves.toEqual({ checkoutId: 'checkout-123', checkoutUrl: 'https://checkout.test/123', paymentId: 'payment-123', status: 'pending' });
    expect(saveOrder).toHaveBeenCalledWith(expect.objectContaining({ paymentId: 'payment-123' }));
  });
});
