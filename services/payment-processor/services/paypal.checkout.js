function createPayPalCheckout({
  clientId,
  clientSecret,
  fetchImpl = fetch,
  apiBaseUrl = 'https://api-m.sandbox.paypal.com'
}) {
  async function getAccessToken() {
    const response = await fetchImpl(`${apiBaseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    const result = await response.json();
    if (!response.ok || !result.access_token) throw new Error('Unable to authenticate with PayPal');
    return result.access_token;
  }

  async function createCheckout(request) {
    if (!clientId || !clientSecret) throw new Error('Missing PayPal credentials');
    const accessToken = await getAccessToken();
    const total = request.items.reduce((sum, item) => sum + item.unitAmount * item.quantity, 0);
    const response = await fetchImpl(`${apiBaseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': request.idempotencyKey
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: request.externalReference,
          amount: { currency_code: request.currency, value: (total / 100).toFixed(2) }
        }],
        application_context: {
          return_url: request.successUrl,
          cancel_url: request.cancelUrl,
          user_action: 'PAY_NOW'
        }
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'PayPal checkout failed');
    const approval = result.links?.find((link) => link.rel === 'approve');
    return { checkoutId: result.id, checkoutUrl: approval?.href, paymentId: result.id };
  }

  return { createCheckout };
}

module.exports = { createPayPalCheckout };
