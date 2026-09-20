const {
  canTransition,
  createInvalidPaymentTransitionError
} = require('./payment-state.machine');

const statusByEventType = {
  'payment.pending': 'pending',
  'payment.approved': 'approved',
  'payment.rejected': 'rejected',
  'payment.refunded': 'refunded',
  'payment.disputed': 'disputed',
  'payment.cancelled': 'cancelled'
};

function createPaymentStatusService({ savePayment, getPayment = async () => undefined }) {
  async function process(event) {
    const status = statusByEventType[event.eventType];
    if (!status) {
      return { status: 'ignored', providerEventId: event.providerEventId };
    }

    const paymentId = event.data.providerPaymentId;
    const currentPayment = await getPayment(paymentId);
    if (currentPayment?.providerEventId === event.providerEventId) {
      return { status: 'duplicate', providerEventId: event.providerEventId };
    }
    if (!canTransition(currentPayment?.status, status)) {
      throw createInvalidPaymentTransitionError(currentPayment?.status, status);
    }

    const paymentUpdate = {
      ...currentPayment,
      paymentId,
      orderId: event.data.orderId,
      provider: event.provider,
      providerEventId: event.providerEventId,
      status
    };
    if (event.data.amount !== undefined) paymentUpdate.amount = event.data.amount;
    if (event.data.currency) paymentUpdate.currency = event.data.currency;
    if (event.data.merchantId) paymentUpdate.merchantId = event.data.merchantId;
    if (event.data.providerTransactionId) {
      paymentUpdate.providerTransactionId = event.data.providerTransactionId;
    }
    await savePayment(paymentUpdate);
    return { status: 'saved', providerEventId: event.providerEventId };
  }

  return { process };
}

module.exports = { createPaymentStatusService, statusByEventType };
