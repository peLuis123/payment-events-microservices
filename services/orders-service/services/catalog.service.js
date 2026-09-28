const { AppError } = require('../middlewares/error.middleware');
const { randomUUID } = require('node:crypto');

function createCatalogService({
  saveProduct,
  saveCategory,
  patchProduct,
  patchCategory,
  getCategory,
  createId = randomUUID,
} = {}) {
  function invalid(message) {
    const error = new AppError(message, 400, 'INVALID_PRODUCT');
    return error;
  }

  async function createProduct(request) {
    if (
      !request.merchantId ||
      !request.name?.trim() ||
      !Number.isInteger(request.price) ||
      request.price <= 0 ||
      !/^[A-Z]{3}$/.test(request.currency || '') ||
      (request.stock !== undefined &&
        (!Number.isInteger(request.stock) || request.stock < 0))
    ) {
      throw invalid('Invalid product');
    }
    await checkCategory(request.categoryId, request.merchantId);
    const product = {
      productId: createId(),
      merchantId: request.merchantId,
      categoryId: request.categoryId,
      sku: request.sku,
      name: request.name.trim(),
      slug:
        request.slug ||
        request.name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-'),
      description: request.description,
      price: request.price,
      currency: request.currency,
      imageUrl: request.imageUrl,
      images: request.images || [],
      attributes: request.attributes || {},
      stock: request.stock || 0,
      status: request.status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveProduct(product);
    return product;
  }

  async function createCategory(request) {
    if (!request.merchantId || !request.name?.trim())
      throw invalid('Invalid category');
    const category = {
      categoryId: createId(),
      merchantId: request.merchantId,
      name: request.name.trim(),
      slug:
        request.slug ||
        request.name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-'),
      description: request.description,
      status: request.status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveCategory(category);
    return category;
  }

  async function checkCategory(categoryId, merchantId) {
    if (!categoryId) return;
    const category = await getCategory(categoryId);
    if (
      !category ||
      category.merchantId !== merchantId ||
      category.status !== 'active'
    )
      throw invalid('Category unavailable for this merchant');
  }
  async function updateProduct(product, changes) {
    await checkCategory(changes.categoryId, product.merchantId);
    return patchProduct(product, {
      ...changes,
      updatedAt: new Date().toISOString(),
    });
  }
  async function updateCategory(category, changes) {
    return patchCategory(category, {
      ...changes,
      updatedAt: new Date().toISOString(),
    });
  }
  return { createProduct, createCategory, updateProduct, updateCategory };
}

module.exports = { createCatalogService };
