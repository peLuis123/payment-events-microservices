const statusByEventType = {
  'payment.pending': 'pending',
  'payment.approved': 'approved',
  'payment.rejected': 'rejected',
  'payment.refunded': 'refunded',
  'payment.disputed': 'disputed',
  'payment.cancelled': 'cancelled'
};

function createPaymentStatusService({ savePayment }) {
  async function process(event) {
    const status = statusByEventType[event.eventType];
    if (!status) {
      return { status: 'ignored', providerEventId: event.providerEventId };
    }

    await savePayment({
      paymentId: event.data.providerPaymentId,
      orderId: event.data.orderId,
      provider: event.provider,
      providerEventId: event.providerEventId,
      status
    });
    return { status: 'saved', providerEventId: event.providerEventId };
  }

  return { process };
}

module.exports = { createPaymentStatusService, statusByEventType };
