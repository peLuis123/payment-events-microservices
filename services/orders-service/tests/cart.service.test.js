const { createCartService } = require('../services/cart.service');

describe('createCartService', () => {
  test('adds a product using the current catalog price', async () => {
    const saveCart = jest.fn().mockResolvedValue(undefined);
    const saveItem = jest.fn().mockResolvedValue(undefined);
    const service = createCartService({
      getProduct: jest.fn().mockResolvedValue({ productId: 'product-123', price: 5799, currency: 'USD', status: 'active' }),
      saveCart,
      saveItem,
      createId: () => 'cart-123'
    });

    await expect(service.addItem({ userId: 'user-123', merchantId: 'merchant-123', productId: 'product-123', quantity: 2 }))
      .resolves.toEqual({ cartId: 'cart-123', productId: 'product-123', quantity: 2, unitAmount: 5799, currency: 'USD' });
    expect(saveItem).toHaveBeenCalledWith(expect.objectContaining({ totalAmount: 11598 }));
  });
});
