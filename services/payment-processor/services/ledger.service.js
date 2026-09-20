function createLedgerService({ recordTransaction }) {
  async function recordPaymentApproved(payment) {
    const transactionId = `payment:${payment.paymentId}`;
    await recordTransaction({
      transactionId,
      paymentId: payment.paymentId,
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

  return { recordPaymentApproved, recordRefund };
}

module.exports = { createLedgerService };
