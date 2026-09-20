async function verifyPayPalWebhook(request, verifier) {
  const valid = await verifier(request);
  if (!valid) throw new Error('Invalid PayPal signature');
  return true;
}

async function verifyPayPalWebhookWithApi(request, {
  clientId,
  clientSecret,
  webhookId,
  fetchImpl = fetch,
  apiBaseUrl = 'https://api-m.sandbox.paypal.com'
}) {
  if (!clientId || !clientSecret || !webhookId) {
    throw new Error('Missing PayPal verification configuration');
  }

  const tokenResponse = await fetchImpl(`${apiBaseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const token = await tokenResponse.json();
  if (!tokenResponse.ok || !token.access_token) throw new Error('Unable to authenticate with PayPal');

  const verificationResponse = await fetchImpl(`${apiBaseUrl}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_algo: request.authAlgo,
      cert_url: request.certUrl,
      transmission_id: request.transmissionId,
      transmission_sig: request.transmissionSignature,
      transmission_time: request.transmissionTime,
      webhook_id: webhookId,
      webhook_event: request.body
    })
  });
  const result = await verificationResponse.json();
  if (!verificationResponse.ok || result.verification_status !== 'SUCCESS') {
    throw new Error('Invalid PayPal signature');
  }
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

module.exports = { verifyPayPalWebhook, verifyPayPalWebhookWithApi, mapPayPalEvent };
