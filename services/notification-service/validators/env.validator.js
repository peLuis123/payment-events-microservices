const { z } = require('zod');

const environmentSchema = z.object({
  AWS_REGION: z.string().trim().min(1),
  SNS_TOPIC_ARN: z.string().trim().regex(/^arn:aws:sns:[a-z0-9-]+:\d{12}:[A-Za-z0-9-_]+$/)
});

/**
 * Validates notification service environment variables.
 *
 * @param {NodeJS.ProcessEnv} environment - Values to validate.
 * @returns {{ AWS_REGION: string, SNS_TOPIC_ARN: string }} Validated environment.
 * @throws {import('zod').ZodError} When a critical value is missing or invalid.
 */
function loadEnvironment(environment = process.env) {
  return environmentSchema.parse(environment);
}

module.exports = { environmentSchema, loadEnvironment };
