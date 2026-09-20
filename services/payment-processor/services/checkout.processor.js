function createCheckoutProcessor({ providers }) {
  async function createCheckout(request) {
    const provider = providers[request.paymentProvider];
    if (!provider) {
      throw new Error(`Unsupported payment provider: ${request.paymentProvider}`);
    }
    return provider.createCheckout(request);
  }

  return { createCheckout };
}

module.exports = { createCheckoutProcessor };
