const { AppError } = require('../middlewares/error.middleware');

function createCommerceController({ cartService, orderService, inventoryService, repository }) {
  function identity(request, next) {
    const userId = request.user?.userId;
    const merchantId = request.merchantId || request.get('X-Merchant-Id');
    if (!userId && !merchantId) { next(new AppError('Authentication required', 401, 'UNAUTHORIZED')); return; }
    return { userId: userId || merchantId, merchantId: merchantId || 'platform-merchant' };
  }
  return {
    addCartItem: async (request, response, next) => { try { const ids = identity(request, next); if (!ids) return; response.status(201).json(await cartService.addItem({ ...request.body, ...ids, cartId: request.params.cartId })); } catch (error) { next(error); } },
    getCart: async (request, response, next) => { try { response.json(await repository.getCart(request.params.cartId)); } catch (error) { next(error); } },
    createOrder: async (request, response, next) => { try { const ids = identity(request, next); if (!ids) return; response.status(201).json(await orderService.createFromCart({ cartId: request.body.cartId, ...ids })); } catch (error) { next(error); } },
    createCheckout: async (request, response, next) => { try { response.status(201).json(await orderService.createCheckout({ ...request.body, orderId: request.params.orderId })); } catch (error) { next(error); } },
    reserve: async (request, response, next) => { try { response.status(201).json(await inventoryService.reserve({ ...request.body, orderId: request.params.orderId })); } catch (error) { next(error); } }
  };
}
module.exports = { createCommerceController };
