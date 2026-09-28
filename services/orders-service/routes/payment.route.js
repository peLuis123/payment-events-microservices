const express = require('express');
const {
  createPaymentController,
} = require('../controllers/payment.controller');

function createPaymentRoute({ paymentClient, getMembership }) {
  const router = express.Router();
  router.get(
    '/payments/:paymentId',
    createPaymentController({ paymentClient, getMembership }),
  );
  return router;
}

module.exports = { createPaymentRoute };
