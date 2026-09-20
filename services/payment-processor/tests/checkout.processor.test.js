const { createCheckoutProcessor } = require('../services/checkout.processor');

describe('createCheckoutProcessor', () => {
  test.each(['stripe', 'paypal'])('creates a checkout using the %s adapter', async (providerName) => {
    const providers = {
      stripe: { createCheckout: jest.fn().mockResolvedValue({ checkoutId: 'stripe-123' }) },
      paypal: { createCheckout: jest.fn().mockResolvedValue({ checkoutId: 'paypal-123' }) }
    };
    const processor = createCheckoutProcessor({ providers });
    const request = { paymentProvider: providerName, idempotencyKey: 'key-123' };

    await expect(processor.createCheckout(request)).resolves.toEqual(
      providerName === 'stripe' ? { checkoutId: 'stripe-123' } : { checkoutId: 'paypal-123' }
    );
    expect(providers[providerName].createCheckout).toHaveBeenCalledWith(request);
  });

  test('rejects an unsupported provider', async () => {
    const processor = createCheckoutProcessor({ providers: {} });
    await expect(processor.createCheckout({ paymentProvider: 'bitcoin' }))
      .rejects.toThrow('Unsupported payment provider');
  });
});
