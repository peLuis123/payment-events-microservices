async function verifyPayPalWebhook(request, verifier) {
  const valid = await verifier(request);
  if (!valid) throw new Error('Invalid PayPal signature');
  return true;
}

function mapPayPalEvent(event) {
  if (typeof event === 'string') {
    event = JSON.parse(event);
  }

  if (event?.body && typeof event.body === 'string') {
    event = JSON.parse(event.body);
  }

  const eventTypeName = event?.event_type || event?.eventType || event?.type;
  const types = {
    'PAYMENT.CAPTURE.COMPLETED': 'payment.approved',
    'PAYMENT.CAPTURE.PENDING': 'payment.pending',
    'PAYMENT.CAPTURE.DENIED': 'payment.rejected',
    'PAYMENT.CAPTURE.REFUNDED': 'payment.refunded',
    'CUSTOMER.DISPUTE.CREATED': 'payment.disputed',
    'PAYMENT.SALE.COMPLETED': 'payment.approved'
  };
  const eventType = types[eventTypeName];
  if (!eventType) throw new Error(`Unsupported PayPal event: ${eventTypeName}`);
  return {
    eventId: event.id,
    provider: 'paypal',
    providerEventId: event.id,
    eventType,
    source: 'webhook-service',
    data: {
      orderId: event.resource.supplementary_data?.related_ids?.order_id,
      providerPaymentId: event.resource.id || event.resource.dispute_id,
      parentPaymentId: event.resource.parent_payment
    }
  };
}

module.exports = { verifyPayPalWebhook, mapPayPalEvent };
