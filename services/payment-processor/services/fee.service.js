function createFeeService({ platformRateBps = 250, fixedFee = 30 }) {
  function calculate({ amount, providerFee = 0 }) {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error('Amount must be a positive integer');
    }
    if (!Number.isInteger(providerFee) || providerFee < 0) {
      throw new Error('Provider fee must be a non-negative integer');
    }
    const platformFee = Math.round((amount * platformRateBps) / 10000) + fixedFee;
    return {
      grossAmount: amount,
      platformFee,
      providerFee,
      merchantNet: amount - platformFee - providerFee
    };
  }

  return { calculate };
}

module.exports = { createFeeService };
