function createProviderApprovalHandler({ captureOrder }) {
  async function handle(event) {
    if (
      event.eventType !== 'payment.pending'
      || event.provider !== 'paypal'
      || event.data.providerEventType !== 'CHECKOUT.ORDER.APPROVED'
    ) {
      return { status: 'already_completed', providerEventId: event.providerEventId };
    }

    const result = await captureOrder(
      event.data.providerPaymentId,
      event.providerEventId
    );
    return {
      status: 'capture_started',
      providerEventId: event.providerEventId,
      captureId: result.captureId
    };
  }

  return handle;
}

module.exports = { createProviderApprovalHandler };
