const { AppError } = require('../middlewares/error.middleware');

function createRefundController({ paymentClient }) {
  return async function createRefund(request, response, next) {
    try {
      if (!request.get('X-Merchant-Id')) {
        next(new AppError('Merchant authentication required', 401, 'UNAUTHORIZED'));
        return;
      }
      const idempotencyKey = request.get('Idempotency-Key');
      if (!idempotencyKey) {
        next(new AppError('Idempotency-Key header required', 400, 'MISSING_IDEMPOTENCY_KEY'));
        return;
      }
      const { paymentId, amount, currency } = request.body || {};
      if (!paymentId || !Number.isInteger(amount) || amount <= 0 || !/^[A-Z]{3}$/.test(currency || '')) {
        next(new AppError('Invalid refund request', 400, 'INVALID_REFUND'));
        return;
      }
      const result = await paymentClient.createRefund({
        paymentId,
        amount,
        currency,
        idempotencyKey
      });
      response.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { createRefundController };
