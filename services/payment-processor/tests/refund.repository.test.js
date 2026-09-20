const { PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { createRefundRepository } = require('../repositories/refund.repository');

describe('createRefundRepository', () => {
  test('persists and loads refunds by idempotency key', async () => {
    const client = {
      send: jest.fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ Item: { refundId: 'refund-123' } })
    };
    const repository = createRefundRepository({ client, tableName: 'Refunds' });

    await expect(repository.save({ refundId: 'refund-123', status: 'COMPLETED' }))
      .resolves.toEqual({ status: 'saved', refundId: 'refund-123' });
    await expect(repository.get('refund-123')).resolves.toEqual({ refundId: 'refund-123' });
    expect(client.send.mock.calls[0][0]).toEqual(expect.any(PutCommand));
    expect(client.send.mock.calls[1][0]).toEqual(expect.any(GetCommand));
  });
});
