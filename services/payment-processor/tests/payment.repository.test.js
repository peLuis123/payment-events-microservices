const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { createPaymentRepository } = require('../repositories/payment.repository');

describe('createPaymentRepository', () => {
  test('persists a payment state update in Payments', async () => {
    const client = { send: jest.fn().mockResolvedValue({}) };
    const repository = createPaymentRepository({ client, tableName: 'Payments' });
    const payment = {
      paymentId: 'capture-123',
      orderId: 'order-123',
      provider: 'paypal',
      providerEventId: 'WH-123',
      status: 'approved'
    };

    await expect(repository.save(payment)).resolves.toEqual({
      status: 'saved',
      paymentId: 'capture-123'
    });
    expect(client.send).toHaveBeenCalledWith(expect.any(PutCommand));
    expect(client.send.mock.calls[0][0].input).toMatchObject({
      TableName: 'Payments',
      Item: expect.objectContaining(payment)
    });
  });
});
