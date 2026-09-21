const { createFeeService } = require('../services/fee.service');

describe('createFeeService', () => {
  test('calculates platform and provider fees in minor units', () => {
    const service = createFeeService({ platformRateBps: 250, fixedFee: 30 });

    expect(service.calculate({ amount: 10000, providerFee: 320 })).toEqual({
      grossAmount: 10000,
      platformFee: 280,
      providerFee: 320,
      merchantNet: 9400
    });
  });

  test('rejects invalid money values', () => {
    const service = createFeeService({ platformRateBps: 250, fixedFee: 30 });
    expect(() => service.calculate({ amount: 0, providerFee: 0 }))
      .toThrow('Amount must be a positive integer');
  });
});
