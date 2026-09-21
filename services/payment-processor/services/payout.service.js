function createPayoutService({
  getBalance,
  getPayout = async () => undefined,
  savePayout = async () => undefined,
  updateBalance = async () => undefined,
  recordPayout = async () => undefined,
  providers
}) {
  function createError(message, code) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  async function create(request) {
    const existing = await getPayout(request.payoutId);
    if (existing) return { status: 'duplicate', payout: existing };

    const balance = await getBalance(request.merchantId);
    if (!balance || balance.available < request.amount) {
      throw createError('Insufficient available balance', 'INSUFFICIENT_BALANCE');
    }
    if (balance.currency && balance.currency !== request.currency) {
      throw createError('Balance currency mismatch', 'CURRENCY_MISMATCH');
    }

    const provider = providers[request.provider];
    if (!provider?.createPayout) {
      throw createError('Payout provider is not configured', 'PAYOUT_PROVIDER_UNAVAILABLE');
    }

    const result = await provider.createPayout(request);
    const payout = {
      payoutId: request.payoutId,
      merchantId: request.merchantId,
      provider: request.provider,
      merchantAccountId: request.merchantAccountId,
      amount: request.amount,
      currency: request.currency,
      providerPayoutId: result.providerPayoutId,
      status: result.status
    };
    await recordPayout(payout);
    await savePayout(payout);
    return payout;
  }

  return { create };
}

module.exports = { createPayoutService };
