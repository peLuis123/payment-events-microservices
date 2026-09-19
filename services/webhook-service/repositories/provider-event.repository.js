function createProviderEventRepository() {
  const events = new Set();
  return {
    async has(provider, providerEventId) {
      return events.has(`${provider}:${providerEventId}`);
    },
    async claim(provider, providerEventId) {
      const key = `${provider}:${providerEventId}`;
      if (events.has(key)) return false;
      events.add(key);
      return true;
    }
  };
}

module.exports = { createProviderEventRepository };
