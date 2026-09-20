function createStripeCheckout({ secretKey, fetchImpl = fetch, apiBaseUrl = 'https://api.stripe.com' }) {
  async function createCheckout(request) {
    if (!secretKey) throw new Error('Missing Stripe secret key');

    const body = new URLSearchParams();
    body.set('mode', 'payment');
    body.set('success_url', request.successUrl);
    body.set('cancel_url', request.cancelUrl);
    body.set('client_reference_id', request.externalReference);
    body.set('metadata[paymentId]', request.paymentId);
    body.set('payment_intent_data[metadata][paymentId]', request.paymentId);
    body.set('payment_intent_data[metadata][merchantId]', request.merchantId);

    request.items.forEach((item, index) => {
      body.set(`line_items[${index}][quantity]`, String(item.quantity));
      body.set(`line_items[${index}][price_data][currency]`, request.currency.toLowerCase());
      body.set(`line_items[${index}][price_data][unit_amount]`, String(item.unitAmount));
      body.set(`line_items[${index}][price_data][product_data][name]`, item.productId);
    });

    const response = await fetchImpl(`${apiBaseUrl}/v1/checkout/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': request.idempotencyKey
      },
      body: body.toString()
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || 'Stripe checkout failed');

    return {
      checkoutId: result.id,
      checkoutUrl: result.url,
      paymentId: request.paymentId,
      providerTransactionId: result.payment_intent
    };
  }

  async function refundPayment({ paymentId, amount, idempotencyKey }) {
    if (!secretKey) throw new Error('Missing Stripe secret key');
    const body = new URLSearchParams({ payment_intent: paymentId });
    if (amount !== undefined) body.set('amount', String(amount));
    const response = await fetchImpl(`${apiBaseUrl}/v1/refunds`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': idempotencyKey
      },
      body: body.toString()
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || 'Stripe refund failed');
    return { refundId: result.id, status: result.status };
  }

  return { createCheckout, refundPayment };
}

module.exports = { createStripeCheckout };
