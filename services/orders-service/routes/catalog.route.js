const express = require('express');
const { createCatalogController } = require('../controllers/catalog.controller');

function createCatalogRoute({ catalogService, catalogRepository }) {
  const router = express.Router();
  const controller = createCatalogController({ catalogService, catalogRepository });
  router.post('/products', controller.createProduct);
  router.get('/products', controller.listProducts);
  router.post('/categories', controller.createCategory);
  router.get('/categories', controller.listCategories);
  return router;
}

module.exports = { createCatalogRoute };
