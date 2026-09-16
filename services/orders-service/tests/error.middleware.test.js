const {
  AppError,
  createErrorHandler
} = require('../middlewares/error.middleware');

function createResponse() {
  return {
    headersSent: false,
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
}

describe('createErrorHandler', () => {
  test('returns a safe response for an expected application error', () => {
    const logger = { warn: jest.fn(), error: jest.fn() };
    const response = createResponse();
    const handler = createErrorHandler({ logger });

    handler(new AppError('Invalid order', 400, 'INVALID_ORDER'), {}, response, jest.fn());

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      error: 'Invalid order',
      code: 'INVALID_ORDER'
    });
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  test('hides internal details for an unexpected error', () => {
    const logger = { warn: jest.fn(), error: jest.fn() };
    const response = createResponse();
    const handler = createErrorHandler({ logger });

    handler(new Error('DynamoDB ARN must not be exposed'), {}, response, jest.fn());

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      error: 'Internal server error'
    });
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(response.json.mock.calls[0][0].error).not.toContain('DynamoDB');
  });

  test('delegates when the response headers were already sent', () => {
    const next = jest.fn();
    const response = createResponse();
    response.headersSent = true;
    const handler = createErrorHandler({
      logger: { warn: jest.fn(), error: jest.fn() }
    });
    const error = new Error('Headers already sent');

    handler(error, {}, response, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(response.status).not.toHaveBeenCalled();
  });
});
