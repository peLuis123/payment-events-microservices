function createProviderStatusHandler({ processStatus, logger }) {
  return async function handleProviderStatus(event) {
    for (const record of event.Records || []) {
      const message = JSON.parse(record.Sns.Message);
      if (!message.providerEventId || !message.eventType || !message.data) {
        throw new Error('Invalid provider status event');
      }
      await processStatus(message);
    }

    return { batchItemFailures: [] };
  };
}

module.exports = { createProviderStatusHandler };
