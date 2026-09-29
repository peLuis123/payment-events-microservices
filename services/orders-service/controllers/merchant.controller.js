const { AppError } = require('../middlewares/error.middleware');

function createMerchantController({ merchantService }) {
  return async function createMerchant(request, response, next) {
    try {
      const ownerUserId = request.user?.userId;
      if (!ownerUserId) {
        next(
          new AppError('Merchant authentication required', 401, 'UNAUTHORIZED'),
        );
        return;
      }
      if (request.user?.role !== 'admin') {
        next(new AppError('Admin role required', 403, 'FORBIDDEN'));
        return;
      }
      response
        .status(201)
        .json(
          await merchantService.create({
            name: request.body?.name,
            defaultCurrency: request.body?.defaultCurrency,
            ownerUserId,
          }),
        );
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { createMerchantController };
