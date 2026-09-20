const express = require('express');
const { createRefundController } = require('../controllers/refund.controller');

function createRefundRoute({ paymentClient }) {
  const router = express.Router();
  router.post('/refunds', createRefundController({ paymentClient }));
  return router;
}

module.exports = { createRefundRoute };
