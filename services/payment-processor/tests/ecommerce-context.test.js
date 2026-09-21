const { createPaymentStatusService } = require('../services/paymentStatus.service');
const { createLedgerService } = require('../services/ledger.service');

describe('ecommerce financial context', () => {
  test('persists user and commercial order context with payment status', async () => {
    const savePayment = jest.fn().mockResolvedValue({ status: 'saved' });
    const service = createPaymentStatusService({ savePayment });

    await service.process({
      provider: 'stripe', providerEventId: 'evt-123', eventType: 'payment.approved',
      data: {
        providerPaymentId: 'payment-123', orderId: 'commercial-123', merchantId: 'merchant-123',
        userId: 'user-123', commercialOrderId: 'commercial-123', amount: 5799, currency: 'USD'
      }
    });

    expect(savePayment).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-123', commercialOrderId: 'commercial-123', merchantId: 'merchant-123'
    }));
  });

  test('includes commercial context in ledger entries', async () => {
    const recordTransaction = jest.fn().mockResolvedValue({ status: 'recorded' });
    const service = createLedgerService({ recordTransaction });

    await service.recordPaymentApproved({
      paymentId: 'payment-123', commercialOrderId: 'commercial-123', userId: 'user-123',
      merchantId: 'merchant-123', amount: 5799, currency: 'USD'
    });

    expect(recordTransaction).toHaveBeenCalledWith(expect.objectContaining({
      commercialOrderId: 'commercial-123', userId: 'user-123'
    }));
  });
});
