const { AppError } = require('../middlewares/error.middleware');
const {
  requireUser,
  requireStoreAdmin,
} = require('../services/resource-access');
function createPaymentController({ paymentClient }) {
  return async function getPayment(request, response, next) {
    try {
      if (!request.user && !request.merchantId) requireUser(request);
      const payment = await paymentClient.getPayment(request.params.paymentId);
      if (!payment) throw new AppError('Payment not found', 404, 'NOT_FOUND');
      if (request.user) {
        if (payment.userId !== request.user.userId)
          await requireStoreAdmin(request, payment.merchantId);
      } else if (payment.merchantId !== request.merchantId)
        throw new AppError('Access denied', 403, 'FORBIDDEN');
      response.json(payment);
    } catch (error) {
      next(error);
    }
  };
}
module.exports = { createPaymentController };
