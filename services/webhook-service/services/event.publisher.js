function createPaymentEventPublisher({ publish }) {
  return { publish: async (event) => publish(event) };
}

module.exports = { createPaymentEventPublisher };
