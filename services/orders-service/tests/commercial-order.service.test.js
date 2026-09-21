const { createCommercialOrderService } = require('../services/commercial-order.service');

describe('createCommercialOrderService', () => {
  test('freezes catalog prices and calculates the order total', async () => {
    const saveOrder = jest.fn().mockResolvedValue(undefined);
    const saveItems = jest.fn().mockResolvedValue(undefined);
    const service = createCommercialOrderService({
      getCartItems: jest.fn().mockResolvedValue([{ productId: 'product-123', quantity: 2 }]),
      getProduct: jest.fn().mockResolvedValue({ productId: 'product-123', name: 'Keyboard', sku: 'KEY-1', price: 5799, currency: 'USD', status: 'active' }),
      saveOrder,
      saveItems,
      createId: () => 'order-123'
    });

    await expect(service.createFromCart({ cartId: 'cart-123', userId: 'user-123', merchantId: 'merchant-123' }))
      .resolves.toMatchObject({ orderId: 'order-123', subtotal: 11598, total: 11598, paymentStatus: 'pending' });
    expect(saveItems).toHaveBeenCalledWith([expect.objectContaining({ unitAmount: 5799, totalAmount: 11598 })]);
  });
});
