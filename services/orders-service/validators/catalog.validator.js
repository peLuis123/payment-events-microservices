const { z } = require('zod');
const { AppError } = require('../middlewares/error.middleware');
const name = z.string().trim().min(1).max(200);
const url = z
  .string()
  .url()
  .refine((value) => /^https?:\/\//.test(value));
const common = {
  name,
  slug: z.string().trim().min(1).max(200),
  description: z.string().max(10000),
  status: z.enum(['active', 'inactive']),
};
const product = {
  ...common,
  price: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  currency: z.string().regex(/^[A-Z]{3}$/),
  categoryId: z.string().min(1),
  sku: z.string().max(200),
  imageUrl: url,
  images: z.array(url).max(20),
  attributes: z.record(z.string(), z.string().max(1000)),
};
const productPatch = z
  .object(product)
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0);
const categoryPatch = z
  .object(common)
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0);
const productCreate = z
  .object({
    ...product,
    name,
    price: product.price,
    currency: product.currency,
    stock: z
      .number()
      .int()
      .nonnegative()
      .max(Number.MAX_SAFE_INTEGER)
      .optional(),
  })
  .partial()
  .required({ name: true, price: true, currency: true })
  .strict();
const categoryCreate = z
  .object(common)
  .partial()
  .required({ name: true })
  .strict();
function validate(schema, input, code = 'INVALID_PRODUCT') {
  const result = schema.safeParse(input);
  if (!result.success)
    throw new AppError(
      'Invalid fields: ' +
        result.error.issues
          .map((issue) => issue.path.join('.') || 'body')
          .join(', '),
      400,
      code,
    );
  return result.data;
}
module.exports = {
  productPatch,
  categoryPatch,
  productCreate,
  categoryCreate,
  validate,
};
