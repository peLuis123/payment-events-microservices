function createReconciliationService() {
  function compare({ paymentId, local, provider }) {
    const differences = [];
    if (local.status !== provider.status) differences.push('status');
    if (local.amount !== provider.amount) differences.push('amount');
    if (local.currency && provider.currency && local.currency !== provider.currency) {
      differences.push('currency');
    }
    return {
      paymentId,
      status: differences.length ? 'mismatch' : 'matched',
      differences
    };
  }

  return { compare };
}

module.exports = { createReconciliationService };
