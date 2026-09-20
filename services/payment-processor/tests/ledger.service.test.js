const { createLedgerService } = require('../services/ledger.service');

describe('createLedgerService', () => {
  test('creates balanced double-entry records for an approved payment', async () => {
    const recordTransaction = jest.fn().mockResolvedValue({ status: 'recorded' });
    const service = createLedgerService({ recordTransaction });

    await expect(service.recordPaymentApproved({
      paymentId: 'pi-123',
      merchantId: 'merchant-123',
      amount: 5799,
      currency: 'USD',
      providerEventId: 'evt-approved-123'
    })).resolves.toEqual({ status: 'recorded', transactionId: 'payment:pi-123' });

    expect(recordTransaction).toHaveBeenCalledWith({
      transactionId: 'payment:pi-123',
      paymentId: 'pi-123',
      merchantId: 'merchant-123',
      amount: 5799,
      currency: 'USD',
      type: 'payment',
      entries: [
        { accountId: 'platform:clearing', direction: 'debit' },
        { accountId: 'merchant:merchant-123', direction: 'credit' }
      ],
      balanceDelta: 5799
    });
  });

  test('creates reverse entries for a refund', async () => {
    const recordTransaction = jest.fn().mockResolvedValue({ status: 'recorded' });
    const service = createLedgerService({ recordTransaction });

    await service.recordRefund({
      refundId: 'refund-123',
      paymentId: 'pi-123',
      merchantId: 'merchant-123',
      amount: 1200,
      currency: 'USD'
    });

    expect(recordTransaction).toHaveBeenCalledWith(expect.objectContaining({
      transactionId: 'refund:refund-123',
      type: 'refund',
      balanceDelta: -1200,
      entries: [
        { accountId: 'merchant:merchant-123', direction: 'debit' },
        { accountId: 'platform:clearing', direction: 'credit' }
      ]
    }));
  });
});
