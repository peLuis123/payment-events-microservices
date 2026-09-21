const { createCatalogService } = require('../services/catalog.service');

describe('createCatalogService', () => {
  test('creates a product with a merchant and catalog fields', async () => {
    const saveProduct = jest.fn().mockResolvedValue({ status: 'saved', productId: 'product-123' });
    const service = createCatalogService({ saveProduct, createId: () => 'product-123' });

    await expect(service.createProduct({
      merchantId: 'merchant-123',
      name: 'Keyboard',
      sku: 'KEY-001',
      description: 'Mechanical keyboard',
      price: 5799,
      currency: 'USD',
      categoryId: 'category-123',
      imageUrl: 'https://images.example/keyboard.png',
      stock: 10
    })).resolves.toMatchObject({ productId: 'product-123', merchantId: 'merchant-123', status: 'active' });
    expect(saveProduct).toHaveBeenCalledWith(expect.objectContaining({
      price: 5799,
      imageUrl: 'https://images.example/keyboard.png',
      stock: 10
    }));
  });

  test('rejects invalid product prices', async () => {
    const service = createCatalogService({ saveProduct: jest.fn() });
    await expect(service.createProduct({ merchantId: 'merchant-123', name: 'Bad', price: 0, currency: 'USD' }))
      .rejects.toMatchObject({ code: 'INVALID_PRODUCT' });
  });
});
