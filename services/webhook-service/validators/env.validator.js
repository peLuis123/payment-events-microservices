const { z } = require('zod');

const environmentSchema = z.object({
  AWS_REGION: z.string().trim().min(1),
  NODE_ENV: z.string().trim().min(1),
  PAYMENT_EVENTS_TOPIC_ARN: z.string().trim().regex(/^arn:aws:sns:[a-z0-9-]+:\d{12}:[A-Za-z0-9-_]+$/),
  STRIPE_WEBHOOK_SECRET: z.string().trim().min(1),
  PAYPAL_WEBHOOK_ID: z.string().trim().min(1),
  PAYPAL_WEBHOOK_SECRET: z.string().trim().min(1),
  PAYPAL_ENVIRONMENT: z.enum(['sandbox', 'production'])
});

/**
 * Validates webhook service configuration without accepting provider secrets directly.
 *
 * @param {NodeJS.ProcessEnv} environment - Configuration values to validate.
 * @returns {object} Validated environment configuration.
 * @throws {import('zod').ZodError} When configuration is incomplete.
 */
function loadEnvironment(environment = process.env) {
  return environmentSchema.parse(environment);
}

module.exports = { environmentSchema, loadEnvironment };
