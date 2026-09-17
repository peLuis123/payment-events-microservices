const { z } = require('zod');

const environmentSchema = z.object({
  AWS_REGION: z.string().trim().min(1),
  SQS_QUEUE_URL: z.string().url(),
  DYNAMODB_TABLE: z.string().trim().min(1),
  SNS_TOPIC_ARN: z.string().trim().regex(/^arn:aws:sns:[a-z0-9-]+:\d{12}:[A-Za-z0-9-_]+$/)
});

/**
 * Validates the critical environment variables for payment processing.
 *
 * @param {NodeJS.ProcessEnv} environment - Environment values to validate.
 * @returns {{ AWS_REGION: string, SQS_QUEUE_URL: string, DYNAMODB_TABLE: string, SNS_TOPIC_ARN: string }} Validated values.
 * @throws {import('zod').ZodError} When a required variable is missing or invalid.
 */
function loadEnvironment(environment = process.env) {
  return environmentSchema.parse(environment);
}

module.exports = {
  environmentSchema,
  loadEnvironment
};
