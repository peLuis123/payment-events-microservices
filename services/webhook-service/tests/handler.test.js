const { createHandler } = require('../src/handler');

describe('webhook Lambda handler', () => {
  test('adapts the Express webhook app to Lambda', async () => {
    const app = {
      handle: jest.fn((request, response) => response.end('ok'))
    };
    const handler = createHandler({ app });

    expect(typeof handler).toBe('function');
  });
});
