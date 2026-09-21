function createSettlementService({ updateBalance, recordSettlement = async () => undefined }) {
  async function settle(request) {
    await updateBalance({
      merchantId: request.merchantId,
      currency: request.currency,
      pendingDelta: -request.amount,
      availableDelta: request.amount,
      transactionId: `settlement:${request.settlementId}`
    });
    await recordSettlement(request);
    return { status: 'settled', settlementId: request.settlementId };
  }

  return { settle };
}

module.exports = { createSettlementService };
