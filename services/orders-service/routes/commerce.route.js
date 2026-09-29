const express = require('express');
const {
  createCommerceController,
} = require('../controllers/commerce.controller');
function createCommerceRoute(dependencies) {
  const router = express.Router();
  const controller = createCommerceController(dependencies);
  router.post('/carts/:cartId/items', controller.addCartItem);
  router.get('/carts/:cartId', controller.getCart);
  router.post('/commercial-orders', controller.createOrder);
  router.get('/commercial-orders', controller.listOrders);
  router.get(
    ['/merchants/:merchantId/orders', '/admin/orders'],
    controller.listMerchantOrders,
  );
  router.post(
    '/commercial-orders/:orderId/checkout',
    controller.createCheckout,
  );
  router.post(
    '/commercial-orders/:orderId/inventory-reservations',
    controller.reserve,
  );
  router.patch('/carts/:cartId/items/:productId', controller.updateCartItem);
  router.delete('/carts/:cartId/items/:productId', controller.removeCartItem);
  router.get('/commercial-orders/:orderId', controller.getOrder);
  return router;
}
module.exports = { createCommerceRoute };
