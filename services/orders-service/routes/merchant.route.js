const express = require('express');
const { createMerchantController } = require('../controllers/merchant.controller');

function createMerchantRoute({ merchantService }) {
  const router = express.Router();
  router.post('/merchants', createMerchantController({ merchantService }));
  return router;
}

module.exports = { createMerchantRoute };
