function createProviderEventProcessor({ claim, publish }) {
  async function process(event) {
    const claimed = await claim(event.provider, event.providerEventId);
    if (!claimed) return { status: 'duplicate', providerEventId: event.providerEventId };
    await publish(event);
    return { status: 'published', providerEventId: event.providerEventId };
  }

  return { process };
}

module.exports = { createProviderEventProcessor };
