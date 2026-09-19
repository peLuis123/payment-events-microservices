const { createProviderEventRepository } = require('../repositories/provider-event.repository');

describe('provider event idempotency', () => {
  test('claims an event once and rejects duplicate claims', async () => {
    const repository = createProviderEventRepository();
    await expect(repository.claim('stripe', 'evt_123')).resolves.toBe(true);
    await expect(repository.claim('stripe', 'evt_123')).resolves.toBe(false);
    await expect(repository.has('stripe', 'evt_123')).resolves.toBe(true);
  });
});
