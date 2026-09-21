const express = require('express');
const { createAuthController } = require('../controllers/auth.controller');

function createAuthRoute({ authService, sessionAuth }) {
  const router = express.Router();
  const controller = createAuthController({ authService });
  router.post('/auth/register', controller.register);
  router.post('/auth/login', controller.login);
  router.post('/auth/refresh', controller.refresh);
  router.post('/auth/logout', controller.logout);
  if (sessionAuth) {
    router.get('/auth/me', sessionAuth, controller.me);
  }
  return router;
}

module.exports = { createAuthRoute };
