const { createCartService } = require('../services/cart.service');
const cart = {
  cartId: 'cart-1',
  userId: 'buyer-1',
  merchantId: 'shop-1',
  currency: 'USD',
  status: 'active',
};
const product = {
  productId: 'product-1',
  merchantId: 'shop-1',
  price: 5799,
  currency: 'USD',
  status: 'active',
};
function setup(overrides = {}) {
  const addItem = jest.fn();
  return {
    addItem,
    service: createCartService({
      getCart: async () => cart,
      getProduct: async () => product,
      addItem,
      ...overrides,
    }),
  };
}
test('adds to an existing cart using the catalog price', async () => {
  const { service, addItem } = setup();
  await service.addItem({
    ...cart,
    productId: product.productId,
    quantity: 2,
    unitAmount: 1,
  });
  expect(addItem).toHaveBeenCalledWith({ cart, product, quantity: 2 });
});
test.each([0, -1, 1.5])('rejects invalid quantity %s', async (quantity) => {
  const { service, addItem } = setup();
  await expect(
    service.addItem({ ...cart, productId: product.productId, quantity }),
  ).rejects.toMatchObject({ statusCode: 400 });
  expect(addItem).not.toHaveBeenCalled();
});
test('rejects a product from another store', async () => {
  const { service, addItem } = setup({
    getProduct: async () => ({ ...product, merchantId: 'other' }),
  });
  await expect(
    service.addItem({ ...cart, productId: product.productId, quantity: 1 }),
  ).rejects.toMatchObject({ statusCode: 400 });
  expect(addItem).not.toHaveBeenCalled();
});
