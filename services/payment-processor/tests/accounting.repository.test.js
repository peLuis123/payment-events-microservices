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

    const command = client.send.mock.calls[1][0];
    expect(command).toEqual(expect.any(TransactWriteCommand));
    expect(command.input.TransactItems).toHaveLength(3);
    expect(command.input.TransactItems[0].Put.Item).toEqual(expect.objectContaining({
      transactionId: 'payment:pi-123',
      direction: 'debit'
    }));
    expect(command.input.TransactItems[2].Update.Key).toEqual({ accountId: 'merchant-123' });
    expect(command.input.TransactItems[2].Update.ConditionExpression)
      .toBe(':delta >= :zero OR (attribute_exists(available) AND available >= :debit)');
  });

  test('requires an existing sufficient balance for a debit', async () => {
    const client = { send: jest.fn().mockResolvedValue({}) };
    const repository = createAccountingRepository({
      client,
      ledgerTableName: 'LedgerEntries',
      balanceTableName: 'Balances'
    });

    await repository.recordTransaction({
      transactionId: 'refund:refund-123',
      paymentId: 'pi-123',
      merchantId: 'merchant-123',
      amount: 600,
      currency: 'USD',
      type: 'refund',
      entries: [
        { accountId: 'merchant:merchant-123', direction: 'debit' },
        { accountId: 'platform:clearing', direction: 'credit' }
      ],
      balanceDelta: -600
    });

    expect(client.send.mock.calls[1][0].input.TransactItems[2].Update.ExpressionAttributeValues)
      .toMatchObject({ ':delta': -600, ':debit': 600, ':zero': 0 });
  });

  test('does not write a transaction twice', async () => {
    const client = {
      send: jest.fn().mockResolvedValueOnce({ Item: { entryId: 'payment:pi-123:0' } })
    };
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
      entries: [],
      balanceDelta: 5799
    })).resolves.toEqual({ status: 'duplicate', transactionId: 'payment:pi-123' });
    expect(client.send).toHaveBeenCalledTimes(1);
  });
});
