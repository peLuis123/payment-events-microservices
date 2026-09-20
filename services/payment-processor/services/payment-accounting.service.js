function createPaymentAccountingService({ getPayment, recordPaymentApproved, recordRefund }) {
  async function process(event) {
    if (!['payment.approved', 'payment.refunded'].includes(event.eventType)) {
      return { status: 'ignored' };
    }

    const payment = await getPayment(event.data.providerPaymentId);
    if (!payment?.merchantId || !payment.amount || !payment.currency) {
      return { status: 'ignored' };
    }

    if (event.eventType === 'payment.approved') {
      return recordPaymentApproved(payment);
    }

    if (!recordRefund) return { status: 'ignored' };
    return recordRefund({
      refundId: event.providerEventId,
      paymentId: payment.paymentId,
      merchantId: payment.merchantId,
      amount: event.data.amount || payment.amount,
      currency: event.data.currency || payment.currency
    });
  }

  return { process };
}

module.exports = { createPaymentAccountingService };
