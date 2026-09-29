const {
  createMerchantRepository,
} = require('../repositories/merchant.repository');
test('lists every membership page using user index', async () => {
  const cursor = { merchantId: 'm1', userId: 'u1' };
  const client = {
    send: jest
      .fn()
      .mockResolvedValueOnce({
        Items: [{ merchantId: 'm1' }],
        LastEvaluatedKey: cursor,
      })
      .mockResolvedValueOnce({ Items: [{ merchantId: 'm2' }] }),
  };
  const repository = createMerchantRepository({ client });
  expect(await repository.listMemberships('u1')).toEqual([
    { merchantId: 'm1' },
    { merchantId: 'm2' },
  ]);
  expect(client.send.mock.calls[0][0].input).toEqual(
    expect.objectContaining({
      IndexName: 'UserIndex',
      KeyConditionExpression: 'userId = :user',
      ExpressionAttributeValues: { ':user': 'u1' },
    }),
  );
  expect(client.send.mock.calls[1][0].input.ExclusiveStartKey).toEqual(cursor);
});
