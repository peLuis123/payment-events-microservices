const { createProviderStatusHandler } = require('../src/provider-status-handler');

describe('provider status handler', () => {
  test('processes a payment status event from SNS', async () => {
    const processStatus = jest.fn().mockResolvedValue({
      status: 'saved',
      providerEventId: 'WH-123'
    });
    const handler = createProviderStatusHandler({ processStatus });
    const message = JSON.stringify({
      eventId: 'event-123',
      provider: 'paypal',
      providerEventId: 'WH-123',
      eventType: 'payment.approved',
      data: { orderId: 'order-123', providerPaymentId: 'capture-123' }
    });

    await expect(handler({
      Records: [{ Sns: { MessageId: 'sns-123', Message: message } }]
    })).resolves.toEqual({ batchItemFailures: [] });
    expect(processStatus).toHaveBeenCalledWith(JSON.parse(message));
  });

  test('captures an approved PayPal order after persisting its pending status', async () => {
    const processStatus = jest.fn().mockResolvedValue({ status: 'saved' });
    const processApproval = jest.fn().mockResolvedValue({ status: 'capture_started' });
    const handler = createProviderStatusHandler({ processStatus, processApproval });
    const message = {
      provider: 'paypal',
      providerEventId: 'WH-124',
      eventType: 'payment.pending',
      data: { providerPaymentId: 'paypal-order-124' }
    };

    await handler({ Records: [{ Sns: { Message: JSON.stringify(message) } }] });

    expect(processStatus).toHaveBeenCalledWith(message);
    expect(processApproval).toHaveBeenCalledWith(message);
    expect(processStatus.mock.invocationCallOrder[0])
      .toBeLessThan(processApproval.mock.invocationCallOrder[0]);
  });

  test('processes accounting after the provider status event', async () => {
    const processStatus = jest.fn().mockResolvedValue({ status: 'saved' });
    const processAccounting = jest.fn().mockResolvedValue({ status: 'recorded' });
    const handler = createProviderStatusHandler({ processStatus, processAccounting });
    const message = {
      provider: 'stripe',
      providerEventId: 'evt-approved-123',
      eventType: 'payment.approved',
      data: { providerPaymentId: 'pi-123' }
    };

    await handler({ Records: [{ Sns: { Message: JSON.stringify(message) } }] });

    expect(processAccounting).toHaveBeenCalledWith(message);
  });
});
