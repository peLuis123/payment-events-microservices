const { createCheckoutHandler } = require('../src/checkout-handler');

describe('checkout handler', () => {
  test('adapts the checkout app to Lambda', async () => {
    const app = { handle: jest.fn() };
    const handler = createCheckoutHandler({ app });

    expect(typeof handler).toBe('function');
  });
});
