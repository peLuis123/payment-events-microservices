const { ZodError } = require('zod');
const { AppError } = require('../middlewares/error.middleware');
const { validateOrderPayload } = require('../validators/order.validator');

/**
 * Creates the controller for incoming payment orders.
 *
 * @param {{ orderService: { createOrder: Function } }} dependencies - Controller dependencies.
 * @returns {Function} Express controller.
 */
function createOrdersController({ orderService }) {
  return async function createOrder(request, response, next) {
    try {
      const order = validateOrderPayload(request.body);
      await orderService.createOrder(order);
      response.status(202).json({ message: 'Order accepted' });
    } catch (error) {
      if (error instanceof ZodError) {
        next(new AppError('Invalid order payload', 400, 'INVALID_ORDER'));
        return;
      }

      next(error);
    }
  };
}

module.exports = {
  createOrdersController
};
