const { verifyPayPalWebhook, mapPayPalEvent } = require('../services/paypal.webhook');

describe('PayPal webhook adapter', () => {
  test('delegates signature verification to the PayPal verifier', async () => {
    const verifier = jest.fn().mockResolvedValue(true);
    await expect(verifyPayPalWebhook({ transmissionId: 'tx-123' }, verifier)).resolves.toBe(true);
    expect(verifier).toHaveBeenCalledWith({ transmissionId: 'tx-123' });
  });

  test('rejects failed verification and maps PayPal events', async () => {
    await expect(verifyPayPalWebhook({}, jest.fn().mockResolvedValue(false))).rejects.toThrow();
    expect(mapPayPalEvent({ id: 'wh_123', event_type: 'PAYMENT.CAPTURE.COMPLETED', resource: { id: 'cap_123', supplementary_data: { related_ids: { order_id: 'order-123' } } } }).eventType).toBe('payment.approved');
    expect(mapPayPalEvent({ id: 'wh_123', event_type: 'PAYMENT.CAPTURE.DENIED', resource: { id: 'cap_123' } }).eventType).toBe('payment.rejected');
    expect(mapPayPalEvent({ id: 'wh_123', event_type: 'PAYMENT.CAPTURE.REFUNDED', resource: { id: 'cap_123' } }).eventType).toBe('payment.refunded');
    expect(mapPayPalEvent({ id: 'wh_123', event_type: 'CUSTOMER.DISPUTE.CREATED', resource: { dispute_id: 'd_123' } }).eventType).toBe('payment.disputed');
  });
});
