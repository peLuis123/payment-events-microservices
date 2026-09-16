const { startServer } = require('../src/server');

describe('startServer', () => {
  test('starts the Express app on the configured port', () => {
    const server = { close: jest.fn() };
    const app = {
      listen: jest.fn((port, onListening) => {
        onListening();
        return server;
      })
    };
    const logger = { info: jest.fn() };

    const result = startServer({ app, port: 3100, logger });

    expect(result).toBe(server);
    expect(app.listen).toHaveBeenCalledWith(3100, expect.any(Function));
    expect(logger.info).toHaveBeenCalledWith(
      { port: 3100 },
      'Orders service is running'
    );
  });
});
