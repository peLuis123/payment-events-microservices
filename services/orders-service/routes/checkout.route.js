const express = require('express');
const { createCheckoutController } = require('../controllers/checkout.controller');

function createCheckoutRoute({ checkoutService }) {
  const router = express.Router();
  router.post('/checkout/sessions', createCheckoutController({ checkoutService }));
  return router;
}

module.exports = { createCheckoutRoute };