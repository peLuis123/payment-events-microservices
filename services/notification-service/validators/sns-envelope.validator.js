const { z } = require('zod');

const snsEnvelopeSchema = z.object({
  EventSubscriptionArn: z.string().trim().min(1).optional(),
  Sns: z.object({
    MessageId: z.string().trim().min(1),
    Message: z.string().trim().min(1)
  }).strict()
}).strict();

/**
 * Validates and extracts an SNS notification envelope.
 *
 * @param {unknown} record - SNS event record.
 * @returns {{ messageId: string, message: string }} Extracted message.
 * @throws {import('zod').ZodError} When the envelope is invalid.
 */
function validateSnsEnvelope(record) {
  const envelope = snsEnvelopeSchema.parse(record);
  return {
    messageId: envelope.Sns.MessageId,
    message: envelope.Sns.Message
  };
}

module.exports = { snsEnvelopeSchema, validateSnsEnvelope };
