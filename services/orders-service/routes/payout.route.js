const express = require('express');
const { createPayoutController } = require('../controllers/payout.controller');

function createPayoutRoute({ paymentClient }) {
  const router = express.Router();
  router.post('/payouts', createPayoutController({ paymentClient }));
  return router;
}

module.exports = { createPayoutRoute };
