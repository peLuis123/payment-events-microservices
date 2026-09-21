const { AppError } = require('../middlewares/error.middleware');

function createBalanceController({ paymentClient }) {
  return async function getBalance(request, response, next) {
    try {
      const merchantId = request.merchantId || request.get('X-Merchant-Id');
      if (!merchantId || merchantId !== request.params.merchantId) {
        next(new AppError('Merchant authentication required', 401, 'UNAUTHORIZED'));
        return;
      }
      response.status(200).json(await paymentClient.getBalance(merchantId));
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { createBalanceController };
