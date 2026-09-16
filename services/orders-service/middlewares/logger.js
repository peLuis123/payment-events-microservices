/**
 * Creates a structured JSON logger for the service.
 *
 * @param {{ service: string, write?: (entry: string) => void }} options - Logger options.
 * @returns {{ info: Function, warn: Function, error: Function }} Logger methods.
 */
function createLogger({ service, write = console.log }) {
  /**
   * Writes a structured log entry without serializing an entire payload.
   *
   * @param {'info'|'warn'|'error'} level - Log severity.
   * @param {{ requestId?: string, eventId?: string }} context - Correlation context.
   * @param {string} message - Safe diagnostic message.
   * @returns {void}
   */
  function log(level, context, message) {
    write(
      JSON.stringify({
        ...context,
        service,
        level,
        message,
        timestamp: new Date().toISOString()
      })
    );
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
