const {
  createCatalogRepository,
} = require('../repositories/catalog.repository');
const {
  TransactWriteCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');
test('creates product and initial inventory atomically', async () => {
  const client = { send: jest.fn().mockResolvedValue({}) };
  await createCatalogRepository({ client }).saveProduct({
    productId: 'p1',
    merchantId: 'm1',
    stock: 3,
    updatedAt: 'now',
  });
  const command = client.send.mock.calls[0][0];
  expect(command).toBeInstanceOf(TransactWriteCommand);
  expect(command.input.TransactItems[1].Put.Item).toMatchObject({
    availableQuantity: 3,
    reservedQuantity: 0,
    productId: 'p1',
  });
});
test('inventory adjustment preserves reservations and updates the public stock in one transaction', async () => {
  const client = {
    send: jest
      .fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        Item: { availableQuantity: 10, reservedQuantity: 2 },
      }),
  };
  const result = await createCatalogRepository({ client }).updateInventory(
    { productId: 'p1', merchantId: 'm1' },
    { availableQuantity: 10, expectedAvailableQuantity: 5 },
  );
  const transaction = client.send.mock.calls[0][0].input.TransactItems;
  expect(transaction[0].Update.UpdateExpression).toContain(
    'reservedQuantity = if_not_exists',
  );
  expect(transaction[0].Update.ConditionExpression).toContain(
    'availableQuantity = :expected',
  );
  expect(transaction[1].Update.ExpressionAttributeValues[':available']).toBe(
    10,
  );
  expect(result.reservedQuantity).toBe(2);
});
test('a stale inventory adjustment returns a conflict', async () => {
  const client = {
    send: jest
      .fn()
      .mockRejectedValue(
        Object.assign(new Error(), { name: 'TransactionCanceledException' }),
      ),
  };
  await expect(
    createCatalogRepository({ client }).updateInventory(
      { productId: 'p1', merchantId: 'm1' },
      { availableQuantity: 10, expectedAvailableQuantity: 5 },
    ),
  ).rejects.toMatchObject({ statusCode: 409 });
});
test('patch updates selected fields, leaving inventory and owner untouched', async () => {
  const client = {
    send: jest
      .fn()
      .mockResolvedValue({
        Attributes: { productId: 'p1', name: 'New', stock: 2 },
      }),
  };
  const result = await createCatalogRepository({ client }).patchProduct(
    { productId: 'p1', merchantId: 'm1' },
    { name: 'New' },
  );
  const command = client.send.mock.calls[0][0];
  expect(command).toBeInstanceOf(UpdateCommand);
  expect(command.input.ExpressionAttributeNames).toEqual({
    '#merchant': 'merchantId',
    '#f0': 'name',
  });
  expect(command.input.ConditionExpression).toContain('#merchant = :merchant');
  expect(result.stock).toBe(2);
});
