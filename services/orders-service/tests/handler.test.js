const express = require('express');
const { createHandler } = require('../src/handler');

describe('createHandler', () => {
  test('adapts an Express response to the Lambda format', async () => {
    const app = express();
    app.get('/health', (request, response) => {
      response.json({ status: 'ok' });
    });

    const handler = createHandler({ app });
    const result = await handler(
      {
        httpMethod: 'GET',
        path: '/health',
        headers: {},
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        stageVariables: null,
        requestContext: { requestId: 'request-123' },
        resource: '/health',
        body: null,
        isBase64Encoded: false
      },
      {}
    );

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({ status: 'ok' });
  });
});
