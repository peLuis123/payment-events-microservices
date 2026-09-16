class AppError extends Error {
  /**
   * Creates an expected application error.
   *
   * @param {string} message - Safe message for the client.
   * @param {number} statusCode - HTTP status code.
   * @param {string} code - Stable application error code.
   */
  constructor(message, statusCode, code) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

/**
 * Creates the centralized Express error middleware.
 *
 * @param {{ logger: { warn: Function, error: Function } }} dependencies - Middleware dependencies.
 * @returns {Function} Express error middleware.
 */
function createErrorHandler({ logger }) {
  /**
   * Handles expected and unexpected application errors.
   *
   * @param {Error} error - Error raised by the request pipeline.
   * @param {object} request - Express request.
   * @param {object} response - Express response.
   * @param {Function} next - Express next function.
   * @returns {void}
   */
  return function errorHandler(error, request, response, next) {
    if (response.headersSent) {
      next(error);
      return;
    }

    const context = request.requestId
      ? { requestId: request.requestId }
      : {};

    if (error.isOperational) {
      logger.warn(context, error.message);
      response.status(error.statusCode).json({
        error: error.message,
        code: error.code
      });
      return;
    }

    logger.error(context, error.stack || error.message);
    response.status(500).json({
      error: 'Internal server error'
    });
  };
}

module.exports = {
  AppError,
  createErrorHandler
};
