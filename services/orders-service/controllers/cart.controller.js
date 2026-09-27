const { AppError } = require('../middlewares/error.middleware');

function createCartController({ cartCreationService }) {
  return async function createCart(request, response, next) {
    try {
      if (!request.user?.userId) { next(new AppError('Authentication required', 401, 'UNAUTHORIZED')); return; }
      const merchantId = request.body?.merchantId || request.merchantId || 'merchant-123';
      const currency = request.body?.currency || 'USD';
      response.status(201).json(await cartCreationService.create({ userId: request.user.userId, merchantId, currency }));
    } catch (error) { next(error); }
  };
}
module.exports = { createCartController };
