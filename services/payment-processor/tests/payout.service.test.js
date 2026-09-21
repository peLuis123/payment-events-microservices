const { createPayoutService } = require('../services/payout.service');

describe('createPayoutService', () => {
  test('creates an idempotent payout from an available balance', async () => {
    const getBalance = jest.fn().mockResolvedValue({
      accountId: 'merchant-123',
      available: 10000,
      currency: 'USD'
    });
    const getPayout = jest.fn().mockResolvedValue(undefined);
    const createProviderPayout = jest.fn().mockResolvedValue({
      providerPayoutId: 'po_123',
      status: 'paid'
    });
    const savePayout = jest.fn().mockResolvedValue({ status: 'saved' });
    const updateBalance = jest.fn().mockResolvedValue({ status: 'updated' });
    const recordPayout = jest.fn().mockResolvedValue({ status: 'recorded' });
    const service = createPayoutService({
      getBalance,
      getPayout,
      savePayout,
      updateBalance,
      recordPayout,
      providers: { stripe: { createPayout: createProviderPayout } }
    });

    await expect(service.create({
      payoutId: 'payout-123',
      merchantId: 'merchant-123',
      provider: 'stripe',
      merchantAccountId: 'acct_123',
      amount: 5000,
      currency: 'USD'
    })).resolves.toEqual({
      payoutId: 'payout-123',
      merchantId: 'merchant-123',
      provider: 'stripe',
      merchantAccountId: 'acct_123',
      amount: 5000,
      currency: 'USD',
      providerPayoutId: 'po_123',
      status: 'paid'
    });
    expect(recordPayout).toHaveBeenCalledWith(expect.objectContaining({
      merchantId: 'merchant-123',
      amount: 5000,
      payoutId: 'payout-123'
    }));
  });

  test('rejects a payout above available balance', async () => {
    const service = createPayoutService({
      getBalance: jest.fn().mockResolvedValue({ available: 1000, currency: 'USD' }),
      providers: { stripe: { createPayout: jest.fn() } }
    });

    await expect(service.create({
      payoutId: 'payout-123',
      merchantId: 'merchant-123',
      provider: 'stripe',
      merchantAccountId: 'acct_123',
      amount: 1001,
      currency: 'USD'
    })).rejects.toMatchObject({ code: 'INSUFFICIENT_BALANCE' });
  });
});
