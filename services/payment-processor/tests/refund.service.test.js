const { createRefundService } = require('../services/refund.service');

describe('createRefundService', () => {
  test('creates and persists a full refund for an approved payment', async () => {
    const getPayment = jest.fn().mockResolvedValue({
      paymentId: 'capture-123',
      provider: 'paypal',
      status: 'approved',
      amount: 5799,
      currency: 'USD'
    });
    const refundPayment = jest.fn().mockResolvedValue({
      refundId: 'provider-refund-123',
      status: 'COMPLETED'
    });
    const saveRefund = jest.fn().mockResolvedValue({ status: 'saved' });
    const savePayment = jest.fn().mockResolvedValue({ status: 'saved' });
    const recordRefund = jest.fn().mockResolvedValue({ status: 'recorded' });
    const service = createRefundService({
      getPayment,
      savePayment,
      saveRefund,
      getRefund: jest.fn().mockResolvedValue(undefined),
      recordRefund,
      providers: { paypal: { refundPayment } }
    });

    await expect(service.refund({
      paymentId: 'capture-123',
      amount: 5799,
      currency: 'USD',
      idempotencyKey: 'refund-request-123'
    })).resolves.toEqual({
      refundId: 'refund-request-123',
      providerRefundId: 'provider-refund-123',
      status: 'COMPLETED'
    });
    expect(saveRefund).toHaveBeenCalledWith(expect.objectContaining({
      refundId: 'refund-request-123',
      providerRefundId: 'provider-refund-123',
      paymentId: 'capture-123',
      status: 'COMPLETED'
    }));
    expect(savePayment).toHaveBeenCalledWith(expect.objectContaining({
      paymentId: 'capture-123',
      status: 'refunded'
    }));
    expect(recordRefund).toHaveBeenCalledWith(expect.objectContaining({
      refundId: 'refund-request-123',
      merchantId: undefined
    }));
  });

  test('rejects a refund larger than the payment amount', async () => {
    const service = createRefundService({
      getPayment: jest.fn().mockResolvedValue({
        paymentId: 'pi-123',
        provider: 'stripe',
        status: 'approved',
        amount: 1000,
        currency: 'USD'
      }),
      providers: { stripe: { refundPayment: jest.fn() } }
    });

    await expect(service.refund({
      paymentId: 'pi-123',
      amount: 1001,
      currency: 'USD',
      idempotencyKey: 'refund-too-large'
    })).rejects.toMatchObject({ code: 'REFUND_AMOUNT_INVALID' });
  });

  test('returns an existing refund for the same idempotency key', async () => {
    const existing = { refundId: 'refund-existing', status: 'COMPLETED' };
    const refundPayment = jest.fn();
    const service = createRefundService({
      getPayment: jest.fn(),
      getRefund: jest.fn().mockResolvedValue(existing),
      providers: { paypal: { refundPayment } }
    });

    await expect(service.refund({
      paymentId: 'capture-123',
      amount: 1000,
      currency: 'USD',
      idempotencyKey: 'refund-existing'
    })).resolves.toEqual({ status: 'duplicate', refund: existing });
    expect(refundPayment).not.toHaveBeenCalled();
  });
});
