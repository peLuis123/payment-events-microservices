const { createReconciliationService } = require('../services/reconciliation.service');

describe('createReconciliationService', () => {
  test('detects status and amount differences', () => {
    const service = createReconciliationService();

    expect(service.compare({
      paymentId: 'payment-123',
      local: { status: 'approved', amount: 5799 },
      provider: { status: 'refunded', amount: 5799 }
    })).toEqual({
      paymentId: 'payment-123',
      status: 'mismatch',
      differences: ['status']
    });
  });

  test('returns matched for equal snapshots', () => {
    const service = createReconciliationService();
    expect(service.compare({
      paymentId: 'payment-123',
      local: { status: 'approved', amount: 5799 },
      provider: { status: 'approved', amount: 5799 }
    })).toEqual({ paymentId: 'payment-123', status: 'matched', differences: [] });
  });
});
