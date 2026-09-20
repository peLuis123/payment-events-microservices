function createPaymentProcessorClient({ baseUrl, fetchImpl = fetch }) {
  if (!baseUrl) throw new Error('Missing payment processor URL');

  async function createCheckout(request) {
    const response = await fetchImpl(
      `${baseUrl.replace(/\/$/, '')}/internal/checkout/sessions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Service': 'orders-service',
          'Idempotency-Key': request.idempotencyKey
        },
        body: JSON.stringify(request)
      }
    );
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || result.message || 'Payment processor checkout failed');
    }
    return result;
  }

  return { createCheckout };
}

module.exports = { createPaymentProcessorClient };
