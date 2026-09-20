const { TransactWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { createAccountingRepository } = require('../repositories/accounting.repository');

describe('createAccountingRepository', () => {
  test('writes double-entry records and balance delta atomically', async () => {
    const client = { send: jest.fn().mockResolvedValue({}) };
    const repository = createAccountingRepository({
      client,
      ledgerTableName: 'LedgerEntries',
      balanceTableName: 'Balances'
    });

    await expect(repository.recordTransaction({
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
    })).resolves.toEqual({ status: 'recorded', transactionId: 'payment:pi-123' });

    const command = client.send.mock.calls[0][0];
    expect(command).toEqual(expect.any(TransactWriteCommand));
    expect(command.input.TransactItems).toHaveLength(3);
    expect(command.input.TransactItems[0].Put.Item).toEqual(expect.objectContaining({
      transactionId: 'payment:pi-123',
      direction: 'debit'
    }));
    expect(command.input.TransactItems[2].Update.Key).toEqual({ merchantId: 'merchant-123' });
  });
});
