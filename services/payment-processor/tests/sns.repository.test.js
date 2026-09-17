const { PublishCommand } = require('@aws-sdk/client-sns');
const { createSnsRepository } = require('../repositories/sns.repository');

describe('createSnsRepository', () => {
  test('publishes a payment result event to SNS', async () => {
    const client = { send: jest.fn().mockResolvedValue({ MessageId: 'message-123' }) };
    const repository = createSnsRepository({ client, topicArn: 'arn:aws:sns:us-east-2:123456789012:payment-events' });
    const event = { eventId: 'event-123', eventType: 'payment.approved', source: 'payment-processor' };

    await expect(repository.publish(event)).resolves.toEqual({ MessageId: 'message-123' });
    expect(client.send).toHaveBeenCalledWith(expect.any(PublishCommand));
    expect(client.send.mock.calls[0][0].input).toEqual({
      TopicArn: 'arn:aws:sns:us-east-2:123456789012:payment-events',
      Message: JSON.stringify(event)
    });
  });
});
