const { AppError } = require('../middlewares/error.middleware');
function createCartService({
  getProduct,
  getCart,
  getCartItem,
  addItem,
  setCartItem,
  removeCartItem,
}) {
  async function add(request) {
    const cart = await getCart(request.cartId);
    if (
      !cart ||
      cart.userId !== request.userId ||
      cart.merchantId !== request.merchantId
    )
      throw new AppError('Cart access denied', 403, 'FORBIDDEN');
    const product = await getProduct(request.productId);
    if (
      cart.status !== 'active' ||
      !product ||
      product.status !== 'active' ||
      product.merchantId !== cart.merchantId ||
      product.currency !== cart.currency ||
      !Number.isSafeInteger(request.quantity) ||
      request.quantity <= 0
    ) {
      throw new AppError('Invalid cart item', 400, 'INVALID_CART_ITEM');
    }
    try {
      await addItem({ cart, product, quantity: request.quantity });
    } catch (error) {
      if (error.name === 'TransactionCanceledException')
        throw new AppError('Cart changed; please retry', 409, 'CART_CONFLICT');
      throw error;
    }
    return {
      cartId: cart.cartId,
      productId: product.productId,
      quantity: request.quantity,
      unitAmount: product.price,
      currency: product.currency,
    };
  }
  async function mutate(request, remove = false) {
    const cart = await getCart(request.cartId);
    if (
      !cart ||
      cart.userId !== request.userId ||
      cart.merchantId !== request.merchantId
    )
      throw new AppError('Cart access denied', 403, 'FORBIDDEN');
    if (cart.status !== 'active')
      throw new AppError('Cart is closed', 409, 'CART_CLOSED');
    if (!remove) {
      const product = await getProduct(request.productId);
      if (
        !product ||
        product.status !== 'active' ||
        product.merchantId !== cart.merchantId ||
        product.currency !== cart.currency ||
        !Number.isSafeInteger(request.quantity) ||
        request.quantity < 1
      )
        throw new AppError('Invalid cart item', 400, 'INVALID_CART_ITEM');
      if (request.quantity > product.stock)
        throw new AppError('Insufficient stock', 409, 'INSUFFICIENT_STOCK');
      if (!(await getCartItem(cart.cartId, product.productId)))
        throw new AppError('Cart item not found', 404, 'NOT_FOUND');
      await setCartItem({ cart, product, quantity: request.quantity });
    } else {
      await removeCartItem({ cart, productId: request.productId });
    }
  }
  async function change(request, remove) {
    try {
      await mutate(request, remove);
    } catch (error) {
      if (error.name === 'TransactionCanceledException')
        throw new AppError(
          'Cart changed; reload and retry',
          409,
          'CART_CONFLICT',
        );
      throw error;
    }
  }
  return {
    addItem: add,
    updateItem: (request) => change(request, false),
    removeItem: (request) => change(request, true),
  };
}
module.exports = { createCartService };
