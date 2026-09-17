const { z } = require('zod');

const paymentOrderSchema = z
  .object({
    orderId: z.string().trim().regex(/^order-[A-Za-z0-9-]+$/),
    customerId: z.string().trim().regex(/^customer-[A-Za-z0-9-]+$/),
    amount: z.number().finite().positive(),
    currency: z.string().trim().regex(/^[A-Z]{3}$/)
  })
  .strict();

const paymentEventSchema = z
  .object({
    eventId: z.string().trim().min(1),
    eventType: z.literal('payment.requested'),
    source: z.literal('orders-service'),
    occurredAt: z.string().datetime({ offset: true }),
    data: paymentOrderSchema
  })
  .strict();

/**
 * Parses and validates an SQS payment message.
 *
 * @param {{ body: string }} record - SQS record containing a JSON body.
 * @returns {object} Validated payment event.
 * @throws {SyntaxError|import('zod').ZodError} When the message is malformed.
 */
function validateSqsMessage(record) {
  return paymentEventSchema.parse(JSON.parse(record.body));
}

module.exports = {
  paymentEventSchema,
  validateSqsMessage
};
