/**
 * Creates a structured logger for provider webhooks.
 *
 * @param {{ service: string, pretty?: boolean, write?: (entry: string) => void }} options - Logger options.
 * @returns {{ info: Function, warn: Function, error: Function }} Logger methods.
 */
function createLogger({ service, pretty = false, write = console.log }) {
  function log(level, context, message) {
    if (pretty) {
      write(`[${service}] ${message}`);
      return;
    }

    write(JSON.stringify({
      ...context,
      service,
      level,
      message,
      timestamp: new Date().toISOString()
    }));
  }

  return {
    info: (context, message) => log('info', context, message),
    warn: (context, message) => log('warn', context, message),
    error: (context, message) => log('error', context, message)
  };
}

module.exports = { createLogger };
