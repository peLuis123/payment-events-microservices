const { GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { createPayoutRepository } = require('../repositories/payout.repository');

describe('createPayoutRepository', () => {
  test('saves and gets a payout by id', async () => {
    const client = {
      send: jest.fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ Item: { payoutId: 'payout-123', status: 'paid' } })
    };
    const repository = createPayoutRepository({ client, tableName: 'Payouts' });

    await expect(repository.save({ payoutId: 'payout-123', status: 'paid' }))
      .resolves.toEqual({ status: 'saved', payoutId: 'payout-123' });
    await expect(repository.get('payout-123')).resolves.toEqual({ payoutId: 'payout-123', status: 'paid' });
    expect(client.send.mock.calls[0][0]).toEqual(expect.any(PutCommand));
    expect(client.send.mock.calls[1][0]).toEqual(expect.any(GetCommand));
  });
});
