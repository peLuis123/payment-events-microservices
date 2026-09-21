const { randomUUID } = require('node:crypto');

function createCartService({ getProduct, saveCart, saveItem, createId = randomUUID }) {
  async function addItem(request) {
    const product = await getProduct(request.productId);
    if (!product || product.status !== 'active' || !Number.isInteger(request.quantity) || request.quantity <= 0) {
      const error = new Error('Invalid cart item');
      error.code = 'INVALID_CART_ITEM';
      throw error;
    }
    const cartId = request.cartId || createId();
    const now = new Date().toISOString();
    await saveCart({ cartId, userId: request.userId, merchantId: request.merchantId, currency: product.currency, status: 'active', updatedAt: now, createdAt: now });
      const item = { cartItemId: `${cartId}:${product.productId}`, cartId, productId: product.productId, quantity: request.quantity, unitAmount: product.price, totalAmount: product.price * request.quantity, createdAt: now, updatedAt: now };
    await saveItem(item);
    return { cartId, productId: item.productId, quantity: item.quantity, unitAmount: item.unitAmount, currency: product.currency };
  }
  return { addItem };
}
module.exports = { createCartService };
