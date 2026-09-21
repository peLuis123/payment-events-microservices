const { AppError } = require('../middlewares/error.middleware');

function requireAdmin(request, next) {
  if (!request.merchantId && !request.get('X-Merchant-Id')) {
    next(new AppError('Merchant authentication required', 401, 'UNAUTHORIZED'));
    return false;
  }
  if (request.user?.role !== 'admin') {
    next(new AppError('Admin role required', 403, 'FORBIDDEN'));
    return false;
  }
  return true;
}

function createCatalogController({ catalogService, catalogRepository }) {
  const merchantId = (request) => request.merchantId || request.get('X-Merchant-Id');
  return {
    createProduct: async (request, response, next) => {
      try {
        if (!requireAdmin(request, next)) return;
        response.status(201).json(await catalogService.createProduct({ ...request.body, merchantId: merchantId(request) }));
      } catch (error) { next(error); }
    },
    listProducts: async (request, response, next) => {
      try { response.json(await catalogRepository.listProducts(request.query.merchantId || merchantId(request))); } catch (error) { next(error); }
    },
    createCategory: async (request, response, next) => {
      try {
        if (!requireAdmin(request, next)) return;
        response.status(201).json(await catalogService.createCategory({ ...request.body, merchantId: merchantId(request) }));
      } catch (error) { next(error); }
    },
    listCategories: async (request, response, next) => {
      try { response.json(await catalogRepository.listCategories(request.query.merchantId || merchantId(request))); } catch (error) { next(error); }
    }
  };
}

module.exports = { createCatalogController };
