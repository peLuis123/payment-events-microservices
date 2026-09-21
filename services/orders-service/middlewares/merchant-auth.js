function createMerchantAuth({ keys = {} } = {}) {
  return function merchantAuth(request, response, next) {
    const apiKey = request.get('X-Api-Key');
    const merchantId = apiKey ? keys[apiKey] : undefined;
    if (!merchantId) {
      response.status(401).json({ error: 'Merchant authentication required', code: 'UNAUTHORIZED' });
      return;
    }
    request.merchantId = merchantId;
    next();
  };
}

function parseMerchantKeys(value = '') {
  return Object.fromEntries(value.split(',').filter(Boolean).map((entry) => entry.split(':', 2)));
}

module.exports = { createMerchantAuth, parseMerchantKeys };
