const { verifyPayPalWebhookWithApi } = require('../services/paypal.webhook');

describe('PayPal API webhook verification', () => {
  test('returns true when PayPal accepts the webhook signature', async () => {
    const fetchImpl = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'token-123' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ verification_status: 'SUCCESS' }) });

    await expect(verifyPayPalWebhookWithApi({
      transmissionId: 'transmission-123',
      transmissionSignature: 'signature-123',
      transmissionTime: '2026-09-20T00:00:00Z',
      certUrl: 'https://api.paypal.com/cert',
      authAlgo: 'SHA256withRSA',
      body: { id: 'WH-123' }
    }, {
      clientId: 'client-123',
      clientSecret: 'secret-123',
      webhookId: 'webhook-123',
      fetchImpl,
      apiBaseUrl: 'https://api-m.sandbox.paypal.com'
    })).resolves.toBe(true);

    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  test('rejects when PayPal verification is not successful', async () => {
    await expect(verifyPayPalWebhookWithApi({}, {
      clientId: 'client-123',
      clientSecret: 'secret-123',
      webhookId: 'webhook-123',
      fetchImpl: jest.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'token' }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ verification_status: 'FAILURE' }) })
    })).rejects.toThrow('Invalid PayPal signature');
  });
});
