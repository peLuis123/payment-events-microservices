const express = require('express');
const {
  createCatalogController,
} = require('../controllers/catalog.controller');

function createCatalogRoute({ catalogService, catalogRepository }) {
  const router = express.Router();
  const controller = createCatalogController({
    catalogService,
    catalogRepository,
  });
  router.post('/products', controller.createProduct);
  router.get('/products', controller.listProducts);
  router.post('/categories', controller.createCategory);
  router.get('/categories', controller.listCategories);
  router.get('/products/:productId', controller.getProduct);
  router.patch('/products/:productId', controller.updateProduct);
  router.patch('/categories/:categoryId', controller.updateCategory);
  router.get('/products/:productId/inventory', controller.getInventory);
  router.patch('/products/:productId/inventory', controller.updateInventory);
  return router;
}

module.exports = { createCatalogRoute };
