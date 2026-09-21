function createLedgerService({ recordTransaction }) {
  async function recordPaymentApproved(payment) {
    const transactionId = `payment:${payment.paymentId}`;
    await recordTransaction({
      transactionId,
      paymentId: payment.paymentId,
      userId: payment.userId,
      commercialOrderId: payment.commercialOrderId,
      merchantId: payment.merchantId,
      amount: payment.amount,
      currency: payment.currency,
      type: 'payment',
      entries: [
        { accountId: 'platform:clearing', direction: 'debit' },
        { accountId: `merchant:${payment.merchantId}`, direction: 'credit' }
      ],
      balanceDelta: payment.amount
    });
    return { status: 'recorded', transactionId };
  }

  async function recordRefund(refund) {
    const transactionId = `refund:${refund.refundId}`;
    await recordTransaction({
      transactionId,
      paymentId: refund.paymentId,
          userId: refund.userId,
          commercialOrderId: refund.commercialOrderId,
      merchantId: refund.merchantId,
      amount: refund.amount,
      currency: refund.currency,
      type: 'refund',
      entries: [
        { accountId: `merchant:${refund.merchantId}`, direction: 'debit' },
        { accountId: 'platform:clearing', direction: 'credit' }
      ],
      balanceDelta: -refund.amount
    });
    return { status: 'recorded', transactionId };
  }

  async function recordSettlement(settlement) {
    const transactionId = `settlement:${settlement.settlementId}`;
    await recordTransaction({
      transactionId,
      paymentId: settlement.paymentId,
      userId: settlement.userId,
      commercialOrderId: settlement.commercialOrderId,
      merchantId: settlement.merchantId,
      amount: settlement.amount,
      currency: settlement.currency,
      type: 'settlement',
      entries: [
        { accountId: `merchant:${settlement.merchantId}:pending`, direction: 'debit' },
        { accountId: `merchant:${settlement.merchantId}:available`, direction: 'credit' }
      ],
      balanceDelta: 0
    });
    return { status: 'recorded', transactionId };
  }

  async function recordPayout(payout) {
    const transactionId = `payout:${payout.payoutId}`;
    await recordTransaction({
      transactionId,
      merchantId: payout.merchantId,
      userId: payout.userId,
      commercialOrderId: payout.commercialOrderId,
      amount: payout.amount,
      currency: payout.currency,
      type: 'payout',
      entries: [
        { accountId: `merchant:${payout.merchantId}:available`, direction: 'debit' },
        { accountId: 'platform:payouts', direction: 'credit' }
      ],
      balanceDelta: -payout.amount
    });
    return { status: 'recorded', transactionId };
  }

  return { recordPaymentApproved, recordRefund, recordSettlement, recordPayout };
}

module.exports = { createLedgerService };
