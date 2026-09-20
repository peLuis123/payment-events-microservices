const transitions = {
  pending: new Set(['pending', 'approved', 'rejected', 'cancelled', 'disputed']),
  approved: new Set(['approved', 'refunded', 'disputed']),
  rejected: new Set(['rejected']),
  cancelled: new Set(['cancelled']),
  disputed: new Set(['disputed', 'approved', 'refunded']),
  refunded: new Set(['refunded'])
};

function canTransition(currentStatus, nextStatus) {
  if (!currentStatus) return true;
  return transitions[currentStatus]?.has(nextStatus) || false;
}

function createInvalidPaymentTransitionError(currentStatus, nextStatus) {
  const error = new Error(`Invalid payment transition: ${currentStatus} -> ${nextStatus}`);
  error.code = 'INVALID_PAYMENT_TRANSITION';
  error.currentStatus = currentStatus;
  error.nextStatus = nextStatus;
  return error;
}

module.exports = { canTransition, createInvalidPaymentTransitionError, transitions };
