function createRefundService({
  getPayment,
  savePayment = async () => undefined,
  getRefund = async () => undefined,
  saveRefund = async () => undefined,
  recordRefund = async () => undefined,
  providers
}) {
  function createError(message, code) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  async function refund(request) {
    const existingRefund = await getRefund(request.idempotencyKey);
    if (existingRefund) return { status: 'duplicate', refund: existingRefund };

    const payment = await getPayment(request.paymentId);
    if (!payment) throw createError('Payment not found', 'PAYMENT_NOT_FOUND');
    if (!['approved', 'disputed'].includes(payment.status)) {
      throw createError('Payment is not refundable', 'PAYMENT_NOT_REFUNDABLE');
    }

    const amount = request.amount ?? payment.amount;
    if (!amount || amount <= 0 || (payment.amount && amount > payment.amount)) {
      throw createError('Refund amount is invalid', 'REFUND_AMOUNT_INVALID');
    }

    const provider = providers[payment.provider];
    if (!provider?.refundPayment) {
      throw createError(`Refund provider is not configured: ${payment.provider}`, 'REFUND_PROVIDER_UNAVAILABLE');
    }

    const providerResult = await provider.refundPayment({
      paymentId: payment.providerTransactionId || payment.paymentId,
      amount: amount === payment.amount ? undefined : amount,
      currency: request.currency || payment.currency,
      idempotencyKey: request.idempotencyKey
    });
    const refundRecord = {
      refundId: request.idempotencyKey,
      providerRefundId: providerResult.refundId,
      paymentId: payment.paymentId,
      provider: payment.provider,
      amount,
      currency: request.currency || payment.currency,
      status: providerResult.status,
      idempotencyKey: request.idempotencyKey
    };
    await saveRefund(refundRecord);
    if (['succeeded', 'COMPLETED'].includes(providerResult.status)) {
      await recordRefund({
        ...refundRecord,
        merchantId: payment.merchantId
      });
    }

    if (amount === payment.amount && ['succeeded', 'COMPLETED'].includes(providerResult.status)) {
      await savePayment({
        ...payment,
        status: 'refunded',
        providerEventId: `refund:${request.idempotencyKey}`
      });
    }

    return {
      refundId: refundRecord.refundId,
      providerRefundId: providerResult.refundId,
      status: providerResult.status
    };
  }

  return { refund };
}

module.exports = { createRefundService };
