const express = require('express');
const { createCartController } = require('../controllers/cart.controller');

function createCartRoute({ cartCreationService }) {
  const router = express.Router();
  router.post('/carts', createCartController({ cartCreationService }));
  return router;
}
module.exports = { createCartRoute };
