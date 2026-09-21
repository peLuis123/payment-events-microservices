const { createSettlementService } = require('../services/settlement.service');

describe('createSettlementService', () => {
  test('moves a pending amount to available after settlement', async () => {
    const updateBalance = jest.fn().mockResolvedValue({ status: 'updated' });
    const recordSettlement = jest.fn().mockResolvedValue({ status: 'recorded' });
    const service = createSettlementService({ updateBalance, recordSettlement });

    await expect(service.settle({
      settlementId: 'settlement-123',
      merchantId: 'merchant-123',
      amount: 9400,
      currency: 'USD'
    })).resolves.toEqual({ status: 'settled', settlementId: 'settlement-123' });
    expect(updateBalance).toHaveBeenCalledWith(expect.objectContaining({
      merchantId: 'merchant-123',
      pendingDelta: -9400,
      availableDelta: 9400
    }));
    expect(recordSettlement).toHaveBeenCalledWith(expect.objectContaining({
      settlementId: 'settlement-123'
    }));
  });
});
