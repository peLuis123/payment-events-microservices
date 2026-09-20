const { z } = require('zod');

const environmentSchema = z.object({
  AWS_REGION: z.string().trim().min(1),
  SQS_QUEUE_URL: z.string().url(),
  PAYMENT_PROCESSOR_CHECKOUT_URL: z.string().url()
});

/**
 * Validates the critical environment variables for the orders service.
 *
 * @param {NodeJS.ProcessEnv} environment - Environment values to validate.
 * @returns {{ AWS_REGION: string, SQS_QUEUE_URL: string, PAYMENT_PROCESSOR_CHECKOUT_URL: string }} Validated values.
 * @throws {import('zod').ZodError} When a required variable is missing or invalid.
 */
function loadEnvironment(environment = process.env) {
  return environmentSchema.parse(environment);
}

module.exports = {
  environmentSchema,
  loadEnvironment
};
