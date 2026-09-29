const { AppError } = require('../middlewares/error.middleware');
const { requireStoreAdmin } = require('../services/resource-access');
const {
  productPatch,
  categoryPatch,
  productCreate,
  categoryCreate,
  validate,
} = require('../validators/catalog.validator');
function createCatalogController({ catalogService, catalogRepository }) {
  const handle = (fn) => async (req, res, next) => {
    try {
      await fn(req, res);
    } catch (error) {
      next(error);
    }
  };
  const merchantId = (req) => req.merchantId || req.query.merchantId;
  async function admin(req, id) {
    await requireStoreAdmin(req, id);
  }
  async function loadProduct(req) {
    const product = await catalogRepository.getProduct(req.params.productId);
    if (
      !product ||
      product.merchantId !== req.storefrontMerchantId ||
      (merchantId(req) && product.merchantId !== merchantId(req))
    )
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    return product;
  }
  async function list(req, res, get) {
    const id = merchantId(req);
    if (!id)
      throw new AppError('Merchant ID required', 400, 'INVALID_MERCHANT');
    if (req.query.includeInactive === 'true') await admin(req, id);
    const items = await get(id);
    res.json(
      req.query.includeInactive === 'true'
        ? items
        : items.filter((item) => item.status === 'active'),
    );
  }
  return {
    createProduct: handle(async (req, res) => {
      const id = merchantId(req);
      await admin(req, id);
      const body = validate(productCreate, req.body);
      res
        .status(201)
        .json(await catalogService.createProduct({ ...body, merchantId: id }));
    }),
    createCategory: handle(async (req, res) => {
      const id = merchantId(req);
      await admin(req, id);
      const body = validate(categoryCreate, req.body, 'INVALID_CATEGORY');
      res
        .status(201)
        .json(await catalogService.createCategory({ ...body, merchantId: id }));
    }),
    listProducts: handle((req, res) =>
      list(req, res, catalogRepository.listProducts),
    ),
    listCategories: handle((req, res) =>
      list(req, res, catalogRepository.listCategories),
    ),
    getProduct: handle(async (req, res) => {
      const product = await loadProduct(req);
      if (product.status !== 'active') await admin(req, product.merchantId);
      res.json(product);
    }),
    updateProduct: handle(async (req, res) => {
      const product = await loadProduct(req);
      await admin(req, product.merchantId);
      res.json(
        await catalogService.updateProduct(
          product,
          validate(productPatch, req.body),
        ),
      );
    }),
    updateCategory: handle(async (req, res) => {
      const category = await catalogRepository.getCategory(
        req.params.categoryId,
      );
      if (!category) throw new AppError('Category not found', 404, 'NOT_FOUND');
      await admin(req, category.merchantId);
      res.json(
        await catalogService.updateCategory(
          category,
          validate(categoryPatch, req.body, 'INVALID_CATEGORY'),
        ),
      );
    }),
    getInventory: handle(async (req, res) => {
      const product = await loadProduct(req);
      await admin(req, product.merchantId);
      const inventory = await catalogRepository.getInventory(product.productId);
      if (!inventory)
        throw new AppError('Inventory not initialized', 404, 'NOT_FOUND');
      res.json(inventory);
    }),
    updateInventory: handle(async (req, res) => {
      const product = await loadProduct(req);
      await admin(req, product.merchantId);
      const body = req.body;
      if (
        !body ||
        Object.keys(body).some(
          (key) =>
            !['availableQuantity', 'expectedAvailableQuantity'].includes(key),
        ) ||
        !Number.isSafeInteger(body.availableQuantity) ||
        body.availableQuantity < 0 ||
        !Number.isSafeInteger(body.expectedAvailableQuantity) ||
        body.expectedAvailableQuantity < 0
      )
        throw new AppError(
          'Valid availableQuantity and expectedAvailableQuantity required',
          400,
          'INVALID_INVENTORY',
        );
      res.json(await catalogRepository.updateInventory(product, body));
    }),
  };
}
module.exports = { createCatalogController };
