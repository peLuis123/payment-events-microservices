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

  test('maps the legacy completed sale event to an approved payment', () => {
    expect(mapPayPalEvent({
      id: 'wh_sale_123',
      event_type: 'PAYMENT.SALE.COMPLETED',
      resource: {
        id: 'sale_123',
        parent_payment: 'PAY-123',
        state: 'completed'
      }
    })).toMatchObject({
      eventType: 'payment.approved',
      data: {
        providerPaymentId: 'sale_123',
        parentPaymentId: 'PAY-123'
      }
    });
  });

  test('maps the complete PayPal capture payload received from the provider', () => {
    const payload = {
      id: 'WH-7Y7254563A4550640-11V2185806837105M',
      event_type: 'PAYMENT.CAPTURE.COMPLETED',
      resource: {
        id: '42311647XV020574X',
        supplementary_data: {
          related_ids: { order_id: '8U481631H66031715' }
        },
        status: 'COMPLETED'
      }
    };

    expect(mapPayPalEvent(payload)).toMatchObject({
      eventType: 'payment.approved',
      data: {
        orderId: '8U481631H66031715',
        providerPaymentId: '8U481631H66031715'
      }
    });
  });

  test('maps a pending capture to a pending payment', () => {
    expect(mapPayPalEvent({
      id: 'wh_pending_123',
      event_type: 'PAYMENT.CAPTURE.PENDING',
      resource: { id: 'capture_pending' }
    })).toMatchObject({
      eventType: 'payment.pending',
      provider: 'paypal'
    });
  });

  test('maps an approved checkout order to a pending payment', () => {
    expect(mapPayPalEvent({
      id: 'wh_order_approved',
      event_type: 'CHECKOUT.ORDER.APPROVED',
      resource: { id: 'paypal-order-123' }
    })).toMatchObject({
      eventType: 'payment.pending',
      provider: 'paypal'
    });
  });

  test.each([
    ['CHECKOUT.ORDER.COMPLETED', 'payment.approved'],
    ['CHECKOUT.ORDER.CANCELLED', 'payment.cancelled'],
    ['PAYMENT.CAPTURE.FAILED', 'payment.rejected'],
    ['PAYMENT.REFUND.COMPLETED', 'payment.refunded'],
    ['PAYMENT.REFUND.DENIED', 'payment.refund.rejected'],
    ['PAYMENT.REFUND.PENDING', 'payment.refund.pending'],
    ['CUSTOMER.DISPUTE.UPDATED', 'payment.dispute.updated'],
    ['CUSTOMER.DISPUTE.RESOLVED', 'payment.dispute.resolved'],
    ['BILLING.SUBSCRIPTION.CANCELLED', 'payment.cancelled'],
    ['PAYMENT.AUTHORIZATION.VOIDED', 'payment.cancelled']
  ])('maps %s to %s', (providerEventType, internalEventType) => {
    expect(mapPayPalEvent({
      id: `wh_${providerEventType}`,
      event_type: providerEventType,
      resource: { id: 'provider-resource-123' }
    }).eventType).toBe(internalEventType);
  });

  test('ignores valid but unhandled PayPal events', () => {
    expect(mapPayPalEvent({
      id: 'wh_ignored',
      event_type: 'PAYMENT.SOMETHING.NEW',
      resource: { id: 'provider-resource-123' }
    })).toBeNull();
  });
});
