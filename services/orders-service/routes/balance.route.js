const express = require('express');
const { createBalanceController } = require('../controllers/balance.controller');

function createBalanceRoute({ paymentClient }) {
  const router = express.Router();
  router.get('/merchants/:merchantId/balance', createBalanceController({ paymentClient }));
  return router;
}

module.exports = { createBalanceRoute };
