const { ZodError } = require('zod');
const { AppError } = require('../middlewares/error.middleware');
const { checkoutSessionSchema } = require('../validators/checkout.validator');

function createCheckoutController({ checkoutService }) {
  return async function createCheckoutSession(request, response, next) {
    try {
      const merchantId = request.get('X-Merchant-Id');
      if (!merchantId) {
        next(new AppError('Merchant authentication required', 401, 'UNAUTHORIZED'));
        return;
      }
      const payload = checkoutSessionSchema.parse({
        ...request.body,
        merchantId,
        idempotencyKey: request.get('Idempotency-Key')
      });
      const session = await checkoutService.createSession(payload);
      response.status(201).json(session);
    } catch (error) {
      if (error instanceof ZodError) {
        next(new AppError('Invalid checkout session payload', 400, 'INVALID_CHECKOUT'));
        return;
      }
      next(error);
    }
  };
}

module.exports = { createCheckoutController };
