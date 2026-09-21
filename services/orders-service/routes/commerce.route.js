const express = require('express');
const { createCommerceController } = require('../controllers/commerce.controller');
function createCommerceRoute(dependencies) {
  const router = express.Router();
  const controller = createCommerceController(dependencies);
  router.post('/carts/:cartId/items', controller.addCartItem);
  router.get('/carts/:cartId', controller.getCart);
  router.post('/commercial-orders', controller.createOrder);
  router.post('/commercial-orders/:orderId/checkout', controller.createCheckout);
  router.post('/commercial-orders/:orderId/inventory-reservations', controller.reserve);
  return router;
}
module.exports = { createCommerceRoute };
