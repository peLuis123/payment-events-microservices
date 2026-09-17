const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const jsYaml = require('js-yaml');
const swaggerUi = require('swagger-ui-express');

const openApiPath = path.join(__dirname, '..', 'docs', 'openapi.yaml');
const openApiDocument = jsYaml.load(fs.readFileSync(openApiPath, 'utf8'));

/**
 * Creates the Swagger UI route.
 *
 * @returns {import('express').Router} Swagger documentation router.
 */
function createDocsRoute() {
  const router = express.Router();
  router.use('/', swaggerUi.serve);
  router.get('/', swaggerUi.setup(openApiDocument));
  return router;
}

module.exports = {
  createDocsRoute
};