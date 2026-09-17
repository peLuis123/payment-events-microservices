const { z } = require('zod');

const paymentEventSchema = z.object({
  eventId: z.string().trim().min(1),
  eventType: z.enum(['payment.approved', 'payment.rejected']),
  source: z.literal('payment-processor'),
  occurredAt: z.string().datetime({ offset: true }),
  data: z.object({
    orderId: z.string().trim().regex(/^order-[A-Za-z0-9-]+$/),
    status: z.enum(['approved', 'rejected']),
    reason: z.string().trim().min(1)
  }).strict()
}).strict();

/**
 * Parses and validates a payment result event.
 *
 * @param {string} message - SNS message containing JSON.
 * @returns {object} Validated payment event.
 * @throws {SyntaxError|import('zod').ZodError} When the message is invalid.
 */
function validatePaymentEvent(message) {
  return paymentEventSchema.parse(JSON.parse(message));
}

module.exports = { paymentEventSchema, validatePaymentEvent };
