function createAuditService({ write }) {
  async function record({ action, actor, reference, outcome = 'success' }) {
    return write({
      action,
      actor,
      reference,
      outcome,
      createdAt: new Date().toISOString()
    });
  }

  return { record };
}

module.exports = { createAuditService };
