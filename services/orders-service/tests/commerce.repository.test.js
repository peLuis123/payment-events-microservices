const {
  createCommerceRepository,
} = require('../repositories/commerce.repository');
const {
  TransactWriteCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');
test('adding again accumulates quantity without recreating the cart', async () => {
  const client = {
    send: jest
      .fn()
      .mockResolvedValueOnce({ Item: { quantity: 2, createdAt: 'before' } })
      .mockResolvedValue({}),
  };
  const repo = createCommerceRepository({ client });
  await repo.addCartItem({
    cart: { cartId: 'c1', userId: 'u1', merchantId: 'm1' },
    product: { productId: 'p1', name: 'Vase', price: 1000 },
    quantity: 3,
  });
  const command = client.send.mock.calls[1][0];
  expect(command).toBeInstanceOf(TransactWriteCommand);
  expect(command.input.TransactItems[0].ConditionCheck.Key).toEqual({
    cartId: 'c1',
  });
  expect(command.input.TransactItems[1].Put.Item).toMatchObject({
    quantity: 5,
    unitAmount: 1000,
    totalAmount: 5000,
    createdAt: 'before',
  });
  expect(command.input.TransactItems[1].Put.ConditionExpression).toBe(
    'quantity = :previous',
  );
});
test('stock and reservation marker are committed together', async () => {
  const client = { send: jest.fn().mockResolvedValue({}) };
  await createCommerceRepository({ client }).reserveInventory({
    orderId: 'o1',
    items: [
      { productId: 'p1', quantity: 2 },
      { productId: 'p2', quantity: 3 },
    ],
  });
  const command = client.send.mock.calls[0][0];
  expect(command).toBeInstanceOf(TransactWriteCommand);
  expect(command.input.TransactItems).toHaveLength(5);
  expect(command.input.TransactItems[0].Update.ConditionExpression).toContain(
    'attribute_not_exists(inventoryStatus)',
  );
  expect(
    command.input.TransactItems[1].Update.ExpressionAttributeValues,
  ).toEqual({ ':delta': -2, ':quantity': 2 });
});
test('checkout updates only payment fields on an existing order', async () => {
  const client = { send: jest.fn().mockResolvedValue({}) };
  await createCommerceRepository({ client }).updateOrderPayment({
    orderId: 'o1',
    paymentId: 'p1',
    paymentStatus: 'pending',
    updatedAt: 'now',
  });
  const command = client.send.mock.calls[0][0];
  expect(command).toBeInstanceOf(UpdateCommand);
  expect(command.input.ConditionExpression).toBe('attribute_exists(orderId)');
  expect(command.input.UpdateExpression).not.toContain('inventoryStatus');
});
