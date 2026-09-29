const { AppError } = require('../middlewares/error.middleware');
const { requireUser, requireMerchantAdmin } = require('./resource-access');

function createMerchantContext({
  getMembership = async () => undefined,
  listMemberships = async () => [],
  getMerchant = async () => undefined,
  storefrontMerchantId,
}) {
  async function activeMerchant(id) {
    if (typeof id !== 'string' || !id)
      throw new AppError('Merchant required', 400, 'INVALID_MERCHANT');
    const merchant = await getMerchant(id);
    if (!merchant || merchant.status !== 'active')
      throw new AppError('Merchant unavailable', 404, 'NOT_FOUND');
    return merchant;
  }
  async function list(req) {
    const userId = requireUser(req);
    if (req.user.role !== 'admin')
      throw new AppError('Admin access required', 403, 'FORBIDDEN');
    const memberships = await listMemberships(userId);
    const merchants = [];
    for (const membership of memberships) {
      // Re-read the primary key: the user index may lag a revoked membership.
      const current = await getMembership(membership.merchantId, userId);
      if (current?.status !== 'active' || current.role !== 'admin') continue;
      const merchant = await getMerchant(membership.merchantId);
      if (merchant?.status === 'active')
        merchants.push({
          merchantId: merchant.merchantId,
          name: merchant.name,
          defaultCurrency: merchant.defaultCurrency,
        });
    }
    return merchants;
  }
  async function resolveAdmin(req) {
    requireUser(req);
    let id = req.query.merchantId;
    if (id === undefined) {
      const merchants = await list(req);
      if (!merchants.length)
        throw new AppError('No active merchant membership', 403, 'NO_MERCHANT');
      if (merchants.length > 1)
        throw new AppError(
          'Select a merchant',
          409,
          'MERCHANT_SELECTION_REQUIRED',
        );
      id = merchants[0].merchantId;
    }
    if (typeof id !== 'string' || !id)
      throw new AppError('Invalid merchant', 400, 'INVALID_MERCHANT');
    await requireMerchantAdmin(req, id, getMembership);
    await activeMerchant(id);
    return id;
  }
  async function resolveStorefront(req) {
    const id = req.query.merchantId || storefrontMerchantId;
    return (await activeMerchant(id)).merchantId;
  }
  return { list, resolveAdmin, resolveStorefront };
}
module.exports = { createMerchantContext };
