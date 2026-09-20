const { createProviderApprovalHandler } = require('../services/paypal.approval.service');

describe('PayPal approval capture flow', () => {
  test('captures the PayPal order after checkout approval', async () => {
    const captureOrder = jest.fn().mockResolvedValue({
      captureId: 'capture-123',
      status: 'COMPLETED'
    });
    const handler = createProviderApprovalHandler({ captureOrder });
    const event = {
      eventType: 'payment.pending',
      provider: 'paypal',
      providerEventId: 'WH-123',
      data: {
        providerPaymentId: 'paypal-order-123',
        providerEventType: 'CHECKOUT.ORDER.APPROVED'
      }
    };

    await expect(handler(event)).resolves.toEqual({
      status: 'capture_started',
      providerEventId: 'WH-123',
      captureId: 'capture-123'
    });
    expect(captureOrder).toHaveBeenCalledWith('paypal-order-123', 'WH-123');
  });

  test('does not capture an already completed payment', async () => {
    const captureOrder = jest.fn();
    const handler = createProviderApprovalHandler({ captureOrder });
    const event = {
      eventType: 'payment.approved',
      provider: 'paypal',
      providerEventId: 'WH-124',
      data: {
        providerPaymentId: 'capture-124',
        providerEventType: 'PAYMENT.CAPTURE.COMPLETED'
      }
    };

    await expect(handler(event)).resolves.toEqual({
      status: 'already_completed',
      providerEventId: 'WH-124'
    });
    expect(captureOrder).not.toHaveBeenCalled();
  });

  test('does not recapture a pending capture event', async () => {
    const captureOrder = jest.fn();
    const handler = createProviderApprovalHandler({ captureOrder });

    await handler({
      eventType: 'payment.pending',
      provider: 'paypal',
      providerEventId: 'WH-125',
      data: {
        providerPaymentId: 'capture-125',
        providerEventType: 'PAYMENT.CAPTURE.PENDING'
      }
    });

    expect(captureOrder).not.toHaveBeenCalled();
  });
});
