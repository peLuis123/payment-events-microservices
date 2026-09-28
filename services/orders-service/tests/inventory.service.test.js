const { createInventoryService } = require('../services/inventory.service');
const order = { orderId: 'order-1', orderStatus: 'pending' };
const items = [
  { productId: 'p1', quantity: 2 },
  { productId: 'p2', quantity: 1 },
];
function setup(overrides = {}) {
  const reserve = jest.fn();
  return {
    reserve,
    service: createInventoryService({
      getOrder: async () => order,
      getOrderItems: async () => items,
      reserve,
      ...overrides,
    }),
  };
}
test('loads quantities from the saved order, ignoring client quantities', async () => {
  const { service, reserve } = setup();
  await expect(
    service.reserve({ orderId: 'order-1', productId: 'evil', quantity: 999 }),
  ).resolves.toEqual({ status: 'reserved', orderId: 'order-1' });
  expect(reserve).toHaveBeenCalledWith({ orderId: 'order-1', items });
});
test('does not reserve twice on a retry', async () => {
  const { service, reserve } = setup({
    getOrder: async () => ({ ...order, inventoryStatus: 'reserved' }),
  });
  await service.reserve({ orderId: 'order-1' });
  expect(reserve).not.toHaveBeenCalled();
});
test('reports a stock conflict instead of a success on failed transaction', async () => {
  const { service } = setup({
    reserve: async () => {
      throw Object.assign(new Error(), {
        name: 'TransactionCanceledException',
      });
    },
  });
  await expect(service.reserve({ orderId: 'order-1' })).rejects.toMatchObject({
    statusCode: 409,
  });
});
test('accepts a concurrent successful reservation without decrementing again', async () => {
  const getOrder = jest
    .fn()
    .mockResolvedValueOnce(order)
    .mockResolvedValue({ ...order, inventoryStatus: 'reserved' });
  const { service } = setup({
    getOrder,
    reserve: async () => {
      throw Object.assign(new Error(), {
        name: 'TransactionCanceledException',
      });
    },
  });
  await expect(service.reserve({ orderId: 'order-1' })).resolves.toMatchObject({
    status: 'reserved',
  });
});
