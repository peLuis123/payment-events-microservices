const { GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
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
      Item: expect.objectContaining(payment),
      ConditionExpression: 'attribute_not_exists(paymentId) OR providerEventId <> :providerEventId'
    });
  });

  test('loads a payment by id', async () => {
    const client = { send: jest.fn().mockResolvedValue({ Item: { paymentId: 'payment-123', status: 'pending' } }) };
    const repository = createPaymentRepository({ client, tableName: 'Payments' });

    await expect(repository.get('payment-123')).resolves.toEqual({
      paymentId: 'payment-123',
      status: 'pending'
    });
    expect(client.send).toHaveBeenCalledWith(expect.any(GetCommand));
    expect(client.send.mock.calls[0][0].input).toEqual({
      TableName: 'Payments',
      Key: { paymentId: 'payment-123' }
    });
  });
});
