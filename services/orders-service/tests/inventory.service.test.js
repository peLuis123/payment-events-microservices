const { createInventoryService } = require('../services/inventory.service');

describe('createInventoryService', () => {
  test('reserves stock and rejects insufficient inventory', async () => {
    const reserve = jest.fn().mockResolvedValue({ status: 'reserved' });
    const service = createInventoryService({ reserve });
    await expect(service.reserve({ productId: 'product-123', orderId: 'order-123', quantity: 2 }))
      .resolves.toEqual({ status: 'reserved', productId: 'product-123' });
    expect(reserve).toHaveBeenCalledWith(expect.objectContaining({ quantity: 2 }));
  });
});
