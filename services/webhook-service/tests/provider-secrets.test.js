const { requireProviderSecrets } = require('../services/provider-secrets');

describe('requireProviderSecrets', () => {
  test('returns configured Stripe and PayPal secrets', () => {
    expect(requireProviderSecrets({
      STRIPE_WEBHOOK_SECRET: 'whsec_test',
      PAYPAL_CLIENT_ID: 'client',
      PAYPAL_CLIENT_SECRET: 'secret',
      PAYPAL_WEBHOOK_ID: 'webhook',
      PAYPAL_ENVIRONMENT: 'sandbox'
    })).toMatchObject({ paypalEnvironment: 'sandbox' });
  });

  test('fails when a required provider secret is missing', () => {
    expect(() => requireProviderSecrets({
      STRIPE_WEBHOOK_SECRET: '',
      PAYPAL_CLIENT_ID: 'client',
      PAYPAL_CLIENT_SECRET: 'secret',
      PAYPAL_WEBHOOK_ID: 'webhook',
      PAYPAL_ENVIRONMENT: 'sandbox'
    })).toThrow('Missing required provider secret');
  });
});
