const { createPaymentStatusService } = require('../services/paymentStatus.service');

describe('createPaymentStatusService', () => {
  test('persists an approved provider event in Payments', async () => {
    const savePayment = jest.fn().mockResolvedValue({ status: 'saved' });
    const service = createPaymentStatusService({ savePayment });
    const event = {
      eventId: 'paypal-event-123',
      provider: 'paypal',
      providerEventId: 'WH-123',
      eventType: 'payment.approved',
      data: {
        orderId: 'order-123',
        providerPaymentId: 'capture-123'
      }
    };

    await expect(service.process(event)).resolves.toEqual({
      status: 'saved',
      providerEventId: 'WH-123'
    });
    expect(savePayment).toHaveBeenCalledWith({
      paymentId: 'capture-123',
      orderId: 'order-123',
      provider: 'paypal',
      providerEventId: 'WH-123',
      status: 'approved'
    });
  });

  test('persists pending and refunded status changes', async () => {
    const savePayment = jest.fn().mockResolvedValue({ status: 'saved' });
    const service = createPaymentStatusService({ savePayment });
    const baseEvent = {
      eventId: 'event-123',
      provider: 'stripe',
      providerEventId: 'evt-123',
      data: { orderId: 'order-123', providerPaymentId: 'pi-123' }
    };

    await service.process({ ...baseEvent, eventType: 'payment.pending' });
    await service.process({ ...baseEvent, eventType: 'payment.refunded' });

    expect(savePayment).toHaveBeenNthCalledWith(1, expect.objectContaining({ status: 'pending' }));
    expect(savePayment).toHaveBeenNthCalledWith(2, expect.objectContaining({ status: 'refunded' }));
  });

  test('rejects an invalid approved to pending transition', async () => {
    const savePayment = jest.fn();
    const getPayment = jest.fn().mockResolvedValue({
      paymentId: 'pi-123',
      status: 'approved',
      providerEventId: 'evt-approved'
    });
    const service = createPaymentStatusService({ savePayment, getPayment });

    await expect(service.process({
      provider: 'stripe',
      providerEventId: 'evt-pending',
      eventType: 'payment.pending',
      data: { orderId: 'order-123', providerPaymentId: 'pi-123' }
    })).rejects.toMatchObject({ code: 'INVALID_PAYMENT_TRANSITION' });
    expect(savePayment).not.toHaveBeenCalled();
  });

  test('ignores a duplicated provider event', async () => {
    const savePayment = jest.fn();
    const getPayment = jest.fn().mockResolvedValue({
      paymentId: 'pi-123',
      status: 'approved',
      providerEventId: 'evt-approved'
    });
    const service = createPaymentStatusService({ savePayment, getPayment });

    await expect(service.process({
      provider: 'stripe',
      providerEventId: 'evt-approved',
      eventType: 'payment.approved',
      data: { orderId: 'order-123', providerPaymentId: 'pi-123' }
    })).resolves.toEqual({ status: 'duplicate', providerEventId: 'evt-approved' });
    expect(savePayment).not.toHaveBeenCalled();
  });
});
