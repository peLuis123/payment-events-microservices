const { createAuditService } = require('../services/audit.service');

describe('createAuditService', () => {
  test('records safe audit events without secrets or payloads', async () => {
    const write = jest.fn().mockResolvedValue({ status: 'saved' });
    const service = createAuditService({ write });

    await expect(service.record({
      action: 'payout.created',
      actor: 'merchant-123',
      reference: 'payout-123',
      secret: 'do-not-store',
      payload: { card: '4242' }
    })).resolves.toEqual({ status: 'saved' });
    expect(write).toHaveBeenCalledWith(expect.objectContaining({
      action: 'payout.created',
      actor: 'merchant-123',
      reference: 'payout-123'
    }));
    expect(write.mock.calls[0][0].secret).toBeUndefined();
    expect(write.mock.calls[0][0].payload).toBeUndefined();
  });
});
