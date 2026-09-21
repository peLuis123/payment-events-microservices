const { randomUUID } = require('node:crypto');

function createCommercialOrderService({ getCartItems, getProduct, saveOrder, saveItems, getOrder = async () => undefined, getOrderItems = async () => [], checkoutService, createId = randomUUID }) {
  async function createFromCart({ cartId, userId, merchantId }) {
    const cartItems = await getCartItems(cartId);
    if (!cartItems?.length) {
      const error = new Error('Cart is empty');
      error.code = 'EMPTY_CART';
      throw error;
    }
    const items = [];
    for (const item of cartItems) {
      const product = await getProduct(item.productId);
      if (!product || product.status !== 'active') throw new Error('Product unavailable');
      items.push({ lineItemId: createId(), orderId: undefined, productId: product.productId, productName: product.name, sku: product.sku, quantity: item.quantity, unitAmount: product.price, totalAmount: product.price * item.quantity });
    }
    const orderId = createId();
    items.forEach((item) => { item.orderId = orderId; });
    const subtotal = items.reduce((sum, item) => sum + item.totalAmount, 0);
    const now = new Date().toISOString();
    const order = { orderId, userId, merchantId, subtotal, discount: 0, tax: 0, shippingAmount: 0, total: subtotal, currency: 'USD', paymentStatus: 'pending', orderStatus: 'pending', createdAt: now, updatedAt: now };
    await saveOrder(order);
    await saveItems(items);
    return order;
  }

  async function createCheckout(request) {
    const order = await getOrder(request.orderId);
    if (!order) throw new Error('Commercial order not found');
    const items = await getOrderItems(order.orderId);
    const session = await checkoutService.createSession({
      merchantId: order.merchantId,
      userId: order.userId,
      commercialOrderId: order.orderId,
      items: items.map((item) => ({ productId: item.productId, quantity: item.quantity, unitAmount: item.unitAmount })),
      currency: order.currency,
      paymentProvider: request.paymentProvider,
      successUrl: request.successUrl,
      cancelUrl: request.cancelUrl,
      externalReference: order.orderId,
      idempotencyKey: request.idempotencyKey
    });
    await saveOrder({ ...order, paymentId: session.paymentId, paymentStatus: session.status, updatedAt: new Date().toISOString() });
    return session;
  }
  return { createFromCart, createCheckout };
}
module.exports = { createCommercialOrderService };
