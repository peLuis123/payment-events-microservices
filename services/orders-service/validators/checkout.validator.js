const { z } = require('zod');

const checkoutSessionSchema = z.object({
  merchantId: z.string().trim().min(1),
  items: z.array(z.object({
    productId: z.string().trim().min(1),
    quantity: z.number().int().positive(),
    unitAmount: z.number().int().positive()
  }).strict()).min(1),
  currency: z.string().trim().regex(/^[A-Z]{3}$/),
  paymentProvider: z.enum(['stripe', 'paypal']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  externalReference: z.string().trim().min(1),
  idempotencyKey: z.string().trim().min(1)
}).strict();

module.exports = { checkoutSessionSchema };
