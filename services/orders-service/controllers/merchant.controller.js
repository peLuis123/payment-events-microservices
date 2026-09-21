const { AppError } = require('../middlewares/error.middleware');

function createMerchantController({ merchantService }) {
  return async function createMerchant(request, response, next) {
    try {
      const ownerUserId = request.merchantId || request.get('X-Merchant-Id');
      if (!ownerUserId) {
        next(new AppError('Merchant authentication required', 401, 'UNAUTHORIZED'));
        return;
      }
      if (request.user?.role !== 'admin') {
        next(new AppError('Admin role required', 403, 'FORBIDDEN'));
        return;
      }
      response.status(201).json(await merchantService.create({ ...request.body, ownerUserId }));
    } catch (error) { next(error); }
  };
}

module.exports = { createMerchantController };
