const { validateSnsEnvelope } = require('../validators/sns-envelope.validator');

describe('validateSnsEnvelope', () => {
  test('extracts a message from a valid SNS record', () => {
    expect(validateSnsEnvelope({
      Sns: { MessageId: 'sns-123', Message: '{"eventId":"event-123"}' }
    })).toEqual({
      messageId: 'sns-123',
      message: '{"eventId":"event-123"}'
    });
  });

  test('rejects an envelope without a message', () => {
    expect(() => validateSnsEnvelope({ Sns: { MessageId: 'sns-123' } })).toThrow();
  });
});
