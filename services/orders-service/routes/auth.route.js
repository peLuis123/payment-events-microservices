const express = require('express');
const { createAuthController } = require('../controllers/auth.controller');

function createAuthRoute({ authService }) {
  const router = express.Router();
  const controller = createAuthController({ authService });
  router.post('/auth/register', controller.register);
  router.post('/auth/login', controller.login);
  return router;
}

module.exports = { createAuthRoute };
