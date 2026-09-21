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

  async function getPayment(paymentId) {
    const response = await fetchImpl(
      `${baseUrl.replace(/\/$/, '')}/internal/payments/${encodeURIComponent(paymentId)}`,
      {
        method: 'GET',
        headers: { 'X-Internal-Service': 'orders-service' }
      }
    );
    const result = await response.json();
    if (!response.ok) {
      const error = new Error(result.error || 'Payment processor query failed');
      error.statusCode = response.status === 404 ? 404 : 502;
      error.code = result.code || 'PAYMENT_QUERY_FAILED';
      error.isOperational = true;
      throw error;
    }
    return result;
  }

  async function createRefund(request) {
    const response = await fetchImpl(
      `${baseUrl.replace(/\/$/, '')}/internal/refunds`,
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
      const error = new Error(result.error || 'Payment processor refund failed');
      error.statusCode = response.status >= 400 && response.status < 500 ? response.status : 502;
      error.code = result.code || 'REFUND_FAILED';
      error.isOperational = true;
      throw error;
    }
    return result;
  }

  async function getBalance(merchantId) {
    const response = await fetchImpl(
      `${baseUrl.replace(/\/$/, '')}/internal/balances/${encodeURIComponent(merchantId)}`,
      { method: 'GET', headers: { 'X-Internal-Service': 'orders-service' } }
    );
    const result = await response.json();
    if (!response.ok) {
      const error = new Error(result.error || 'Payment processor balance query failed');
      error.statusCode = 502;
      error.code = result.code || 'BALANCE_QUERY_FAILED';
      error.isOperational = true;
      throw error;
    }
    return result;
  }

  async function createPayout(request) {
    const response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}/internal/payouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Service': 'orders-service',
        'Idempotency-Key': request.idempotencyKey
      },
      body: JSON.stringify(request)
    });
    const result = await response.json();
    if (!response.ok) {
      const error = new Error(result.error || 'Payment processor payout failed');
      error.statusCode = response.status >= 400 && response.status < 500 ? response.status : 502;
      error.code = result.code || 'PAYOUT_FAILED';
      error.isOperational = true;
      throw error;
    }
    return result;
  }

  return { createCheckout, getPayment, createRefund, getBalance, createPayout };
}

module.exports = { createPaymentProcessorClient };
