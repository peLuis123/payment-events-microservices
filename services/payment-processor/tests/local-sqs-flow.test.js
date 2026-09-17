const { createSqsHandler } = require('../src/handler');
const { createPaymentProcessor } = require('../services/paymentProcessing.service');
const { decidePayment } = require('../services/paymentValidation.service');

function createEvent(eventId, amount = 49.99) {
  return {
    eventId,
    eventType: 'payment.requested',
    source: 'orders-service',
    occurredAt: '2026-09-16T23:00:00.000Z',
    data: {
      orderId: `order-${eventId}`,
      customerId: 'customer-456',
      amount,
      currency: 'USD'
    }
  };
}

describe('local SQS flow', () => {
  test('processes a valid message and skips its duplicate delivery', async () => {
    const processedIds = new Set();
    const processPayment = jest.fn((order) => decidePayment(order));
    const processor = createPaymentProcessor({
      processPayment,
      hasProcessed: async (eventId) => processedIds.has(eventId),
      markProcessed: async (eventId) => processedIds.add(eventId)
    });
    const handler = createSqsHandler({
      processMessage: (event) => processor.process(event)
    });
    const record = {
      messageId: 'message-1',
      body: JSON.stringify(createEvent('event-1'))
    };

    await expect(handler({ Records: [record] })).resolves.toEqual({
      batchItemFailures: []
    });
    await expect(handler({ Records: [record] })).resolves.toEqual({
      batchItemFailures: []
    });

    expect(processPayment).toHaveBeenCalledTimes(1);
  });

  test('rejects an invalid message before business processing', async () => {
    const processMessage = jest.fn();
    const handler = createSqsHandler({ processMessage });

    await expect(handler({
      Records: [{ messageId: 'message-2', body: '{invalid-json' }]
    })).rejects.toThrow();
    expect(processMessage).not.toHaveBeenCalled();
  });

  test('processes a valid message with a rejected payment decision', async () => {
    const processMessage = jest.fn((event) => decidePayment(event.data));
    const handler = createSqsHandler({ processMessage });

    await expect(handler({
      Records: [{
        messageId: 'message-3',
        body: JSON.stringify(createEvent('event-3', 1000.01))
      }]
    })).resolves.toEqual({ batchItemFailures: [] });
    expect(processMessage).toHaveReturnedWith({
      status: 'rejected',
      reason: 'Amount exceeds simulated payment limit'
    });
  });
});
