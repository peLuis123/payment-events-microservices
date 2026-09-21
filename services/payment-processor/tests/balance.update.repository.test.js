const { UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { createBalanceRepository } = require('../repositories/balance.repository');

describe('createBalanceRepository', () => {
  test('updates pending and available atomically', async () => {
    const client = { send: jest.fn().mockResolvedValue({}) };
    const repository = createBalanceRepository({ client, tableName: 'Balances' });

    await expect(repository.update({
      merchantId: 'merchant-123',
      currency: 'USD',
      pendingDelta: -9400,
      availableDelta: 9400
    })).resolves.toEqual({ status: 'updated', merchantId: 'merchant-123' });
    expect(client.send).toHaveBeenCalledWith(expect.any(UpdateCommand));
    expect(client.send.mock.calls[0][0].input.Key).toEqual({ accountId: 'merchant-123' });
  });
});
