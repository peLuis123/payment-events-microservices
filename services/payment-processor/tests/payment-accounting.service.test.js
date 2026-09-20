const { createPaymentAccountingService } = require('../services/payment-accounting.service');

describe('createPaymentAccountingService', () => {
  test('records an approved payment in the ledger', async () => {
    const getPayment = jest.fn().mockResolvedValue({
      paymentId: 'pi-123',
      merchantId: 'merchant-123',
      amount: 5799,
      currency: 'USD'
    });
    const recordPaymentApproved = jest.fn().mockResolvedValue({ status: 'recorded' });
    const service = createPaymentAccountingService({ getPayment, recordPaymentApproved });

    await expect(service.process({
      eventType: 'payment.approved',
      data: { providerPaymentId: 'pi-123' }
    })).resolves.toEqual({ status: 'recorded' });
    expect(recordPaymentApproved).toHaveBeenCalledWith(expect.objectContaining({
      paymentId: 'pi-123',
      merchantId: 'merchant-123',
      amount: 5799
    }));
  });

  test('ignores events without accounting context', async () => {
    const recordPaymentApproved = jest.fn();
    const service = createPaymentAccountingService({
      getPayment: jest.fn().mockResolvedValue(undefined),
      recordPaymentApproved
    });

    await expect(service.process({
      eventType: 'payment.approved',
      data: { providerPaymentId: 'missing' }
    })).resolves.toEqual({ status: 'ignored' });
    expect(recordPaymentApproved).not.toHaveBeenCalled();
  });
});
