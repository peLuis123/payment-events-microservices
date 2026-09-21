const { AppError } = require('../middlewares/error.middleware');

function createPaymentController({ paymentClient }) {
  return async function getPayment(request, response, next) {
    try {
      if (!request.merchantId && !request.get('X-Merchant-Id')) {
        next(new AppError('Merchant authentication required', 401, 'UNAUTHORIZED'));
        return;
      }
      const payment = await paymentClient.getPayment(request.params.paymentId);
      response.status(200).json(payment);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { createPaymentController };
