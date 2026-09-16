/**
 * Creates a structured JSON logger for the service.
 *
 * @param {{ service: string, pretty?: boolean, write?: (entry: string) => void }} options - Logger options.
 * @returns {{ info: Function, warn: Function, error: Function }} Logger methods.
 */
function createLogger({ service, pretty = false, write = console.log }) {
  /**
   * Writes a structured log entry without serializing an entire payload.
   *
   * @param {'info'|'warn'|'error'} level - Log severity.
   * @param {{ requestId?: string, eventId?: string }} context - Correlation context.
   * @param {string} message - Safe diagnostic message.
   * @returns {void}
   */
  function log(level, context, message) {
    const entry = {
      ...context,
      service,
      level,
      message,
      timestamp: new Date().toISOString()
    };

    if (pretty) {
      const location = context.port
        ? ` on http://localhost:${context.port}`
        : '';
      write(`[${service}] ${message}${location}`);
      return;
    }

    write(JSON.stringify(entry));
  }

  return {
    info: (context, message) => log('info', context, message),
    warn: (context, message) => log('warn', context, message),
    error: (context, message) => log('error', context, message)
  };
}

module.exports = {
  createLogger
};
