const express = require('express');
const { createPaymentController } = require('../controllers/payment.controller');

function createPaymentRoute({ paymentClient }) {
  const router = express.Router();
  router.get('/payments/:paymentId', createPaymentController({ paymentClient }));
  return router;
}

module.exports = { createPaymentRoute };
