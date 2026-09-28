const { AppError } = require('../middlewares/error.middleware');
function createInventoryService({ reserve, getOrder, getOrderItems }) {
  async function reserveStock({ orderId }) {
    const order = await getOrder(orderId);
    if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
    if (order.inventoryStatus === 'reserved')
      return { status: 'reserved', orderId };
    const items = order.items || (await getOrderItems(orderId));
    if (
      order.orderStatus !== 'pending' ||
      !items.length ||
      items.some(
        (item) =>
          !item.productId ||
          !Number.isSafeInteger(item.quantity) ||
          item.quantity <= 0,
      )
    )
      throw new AppError(
        'Invalid inventory reservation',
        400,
        'INVALID_RESERVATION',
      );
    const quantities = new Map();
    for (const item of items)
      quantities.set(
        item.productId,
        (quantities.get(item.productId) || 0) + item.quantity,
      );
    if (quantities.size > 49)
      throw new AppError(
        'Too many distinct products',
        400,
        'INVALID_RESERVATION',
      );
    try {
      await reserve({
        orderId,
        items: [...quantities].map(([productId, quantity]) => ({
          productId,
          quantity,
        })),
      });
    } catch (error) {
      if (error.name !== 'TransactionCanceledException') throw error;
      if ((await getOrder(orderId))?.inventoryStatus !== 'reserved')
        throw new AppError(
          'Insufficient stock or order unavailable',
          409,
          'INVENTORY_CONFLICT',
        );
    }
    return { status: 'reserved', orderId };
  }
  return { reserve: reserveStock };
}
module.exports = { createInventoryService };
