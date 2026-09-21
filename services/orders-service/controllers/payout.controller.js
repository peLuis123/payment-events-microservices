const { AppError } = require('../middlewares/error.middleware');

function createPayoutController({ paymentClient }) {
  return async function createPayout(request, response, next) {
    try {
      const merchantId = request.get('X-Merchant-Id');
      const idempotencyKey = request.get('Idempotency-Key');
      if (!merchantId) {
        next(new AppError('Merchant authentication required', 401, 'UNAUTHORIZED'));
        return;
      }
      if (!idempotencyKey) {
        next(new AppError('Idempotency-Key header required', 400, 'MISSING_IDEMPOTENCY_KEY'));
        return;
      }
      const { payoutId, provider, merchantAccountId, amount, currency } = request.body || {};
      if (!payoutId || !provider || !merchantAccountId || !Number.isInteger(amount) || amount <= 0 || !/^[A-Z]{3}$/.test(currency || '')) {
        next(new AppError('Invalid payout request', 400, 'INVALID_PAYOUT'));
        return;
      }
      response.status(201).json(await paymentClient.createPayout({
        payoutId,
        merchantId,
        provider,
        merchantAccountId,
        amount,
        currency,
        idempotencyKey
      }));
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { createPayoutController };
