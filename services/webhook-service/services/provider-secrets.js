function requireProviderSecrets(environment = process.env) {
  const names = [
    'STRIPE_WEBHOOK_SECRET',
    'PAYPAL_CLIENT_ID',
    'PAYPAL_CLIENT_SECRET',
    'PAYPAL_WEBHOOK_ID'
  ];
  for (const name of names) {
    if (!environment[name]) throw new Error(`Missing required provider secret: ${name}`);
  }
  return {
    stripeWebhookSecret: environment.STRIPE_WEBHOOK_SECRET,
    paypalClientId: environment.PAYPAL_CLIENT_ID,
    paypalClientSecret: environment.PAYPAL_CLIENT_SECRET,
    paypalWebhookId: environment.PAYPAL_WEBHOOK_ID,
    paypalEnvironment: environment.PAYPAL_ENVIRONMENT || 'sandbox'
  };
}

module.exports = { requireProviderSecrets };
