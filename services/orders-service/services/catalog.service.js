const { randomUUID } = require('node:crypto');

function createCatalogService({ saveProduct, saveCategory, createId = randomUUID } = {}) {
  function invalid(message) {
    const error = new Error(message);
    error.code = 'INVALID_PRODUCT';
    return error;
  }

  async function createProduct(request) {
    if (!request.merchantId || !request.name?.trim() || !Number.isInteger(request.price) || request.price <= 0 || !/^[A-Z]{3}$/.test(request.currency || '') || (request.stock !== undefined && (!Number.isInteger(request.stock) || request.stock < 0))) {
      throw invalid('Invalid product');
    }
    const product = {
      productId: createId(),
      merchantId: request.merchantId,
      categoryId: request.categoryId,
      sku: request.sku,
      name: request.name.trim(),
      slug: request.slug || request.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: request.description,
      price: request.price,
      currency: request.currency,
      imageUrl: request.imageUrl,
      images: request.images || [],
      attributes: request.attributes || {},
      stock: request.stock || 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await saveProduct(product);
    return product;
  }

  async function createCategory(request) {
    if (!request.merchantId || !request.name?.trim()) throw invalid('Invalid category');
    const category = {
      categoryId: createId(),
      merchantId: request.merchantId,
      name: request.name.trim(),
      slug: request.slug || request.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: request.description,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await saveCategory(category);
    return category;
  }

  return { createProduct, createCategory };
}

module.exports = { createCatalogService };
