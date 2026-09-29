const { AppError } = require('../middlewares/error.middleware');
const {
  requireUser,
  requireOwner,
  requireStoreAdmin,
} = require('../services/resource-access');
function createCommerceController({
  cartService,
  orderService,
  inventoryService,
  repository,
}) {
  const handle = (fn) => async (request, response, next) => {
    try {
      await fn(request, response);
    } catch (error) {
      next(error);
    }
  };
  async function cartFor(request) {
    requireUser(request);
    return requireOwner(
      request,
      await repository.getCart(request.params.cartId || request.body?.cartId),
    );
  }
  async function orderFor(request) {
    requireUser(request);
    return requireOwner(
      request,
      await repository.getOrder(request.params.orderId),
    );
  }
  return {
    addCartItem: handle(async (req, res) => {
      const cart = await cartFor(req);
      res.status(201).json(
        await cartService.addItem({
          ...req.body,
          cartId: cart.cartId,
          userId: cart.userId,
          merchantId: cart.merchantId,
        }),
      );
    }),
    updateCartItem: handle(async (req, res) => {
      const cart = await cartFor(req);
      if (!req.body || Object.keys(req.body).some((key) => key !== 'quantity'))
        throw new AppError(
          'Only quantity can be updated',
          400,
          'INVALID_CART_ITEM',
        );
      await cartService.updateItem({
        cartId: cart.cartId,
        productId: req.params.productId,
        quantity: req.body.quantity,
        userId: cart.userId,
        merchantId: cart.merchantId,
      });
      res.status(204).end();
    }),
    removeCartItem: handle(async (req, res) => {
      const cart = await cartFor(req);
      await cartService.removeItem({
        cartId: cart.cartId,
        productId: req.params.productId,
        userId: cart.userId,
        merchantId: cart.merchantId,
      });
      res.status(204).end();
    }),
    getOrder: handle(async (req, res) => {
      requireUser(req);
      const order = await repository.getOrder(req.params.orderId);
      if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
      if (order.userId !== req.user.userId)
        await requireStoreAdmin(req, order.merchantId);
      res.json({
        ...order,
        items: order.items || (await repository.getOrderItems(order.orderId)),
      });
    }),
    getCart: handle(async (req, res) => {
      const cart = await cartFor(req);
      res.json({ ...cart, items: await repository.getCartItems(cart.cartId) });
    }),
    createOrder: handle(async (req, res) => {
      const cart = await cartFor(req);
      res.status(201).json(
        await orderService.createFromCart({
          cartId: cart.cartId,
          userId: cart.userId,
          merchantId: cart.merchantId,
          currency: cart.currency,
        }),
      );
    }),
    listOrders: handle(async (req, res) =>
      res.json(await repository.listOrdersByUser(requireUser(req))),
    ),
    listMerchantOrders: handle(async (req, res) => {
      const id = req.params.merchantId || req.storefrontMerchantId;
      await requireStoreAdmin(req, id);
      res.json(await repository.listOrders(id));
    }),
    createCheckout: handle(async (req, res) => {
      const order = await orderFor(req);
      const idempotencyKey = req.get('Idempotency-Key');
      if (!idempotencyKey)
        throw new AppError('Idempotency-Key required', 400, 'INVALID_CHECKOUT');
      res.status(201).json(
        await orderService.createCheckout({
          ...req.body,
          orderId: order.orderId,
          idempotencyKey,
        }),
      );
    }),
    reserve: handle(async (req, res) => {
      const order = await orderFor(req);
      res
        .status(201)
        .json(await inventoryService.reserve({ orderId: order.orderId }));
    }),
  };
}
module.exports = { createCommerceController };
