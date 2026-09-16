const { z } = require('zod');

const orderSchema = z
  .object({
    orderId: z.string().trim().regex(/^order-[A-Za-z0-9-]+$/),
    customerId: z.string().trim().regex(/^customer-[A-Za-z0-9-]+$/),
    amount: z.number().finite().positive(),
    currency: z.string().trim().regex(/^[A-Z]{3}$/)
  })
  .strict();

/**
 * Validates and returns a payment order payload.
 *
 * @param {unknown} payload - External order payload.
 * @returns {{ orderId: string, customerId: string, amount: number, currency: string }} Validated order.
 * @throws {import('zod').ZodError} When the payload is invalid.
 */
function validateOrderPayload(payload) {
  return orderSchema.parse(payload);
}

module.exports = {
  orderSchema,
  validateOrderPayload
};
