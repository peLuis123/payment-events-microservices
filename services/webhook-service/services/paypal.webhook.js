async function verifyPayPalWebhook(request, verifier) {
  const valid = await verifier(request);
  if (!valid) throw new Error('Invalid PayPal signature');
  return true;
}

function mapPayPalEvent(event) {
  const types = {
    'PAYMENT.CAPTURE.COMPLETED': 'payment.approved',
    'PAYMENT.CAPTURE.DENIED': 'payment.rejected',
    'PAYMENT.CAPTURE.REFUNDED': 'payment.refunded',
    'CUSTOMER.DISPUTE.CREATED': 'payment.disputed'
  };
  const eventType = types[event.event_type];
  if (!eventType) throw new Error(`Unsupported PayPal event: ${event.event_type}`);
  return {
    eventId: event.id,
    provider: 'paypal',
    providerEventId: event.id,
    eventType,
    source: 'webhook-service',
    data: { orderId: event.resource.supplementary_data?.related_ids?.order_id, providerPaymentId: event.resource.id || event.resource.dispute_id }
  };
}

module.exports = { verifyPayPalWebhook, mapPayPalEvent };
