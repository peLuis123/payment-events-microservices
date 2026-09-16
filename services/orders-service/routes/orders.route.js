const express = require('express');
const { createOrdersController } = require('../controllers/orders.controller');

/**
 * Creates the orders route.
 *
 * @param {{ orderService: { createOrder: Function } }} dependencies - Route dependencies.
 * @returns {import('express').Router} Orders router.
 */
function createOrdersRoute({ orderService }) {
  const router = express.Router();
  const controller = createOrdersController({ orderService });

  router.post('/orders', controller);
  return router;
}

module.exports = {
  createOrdersRoute
};
