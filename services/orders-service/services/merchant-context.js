const { AppError } = require('../middlewares/error.middleware');
const { requireStoreAdmin } = require('./resource-access');
function createMerchantContext({ storefrontMerchantId }) {
  function resolveStorefront(req) {
    if (
      typeof storefrontMerchantId !== 'string' ||
      !storefrontMerchantId.trim()
    )
      throw new AppError(
        'Storefront not configured',
        503,
        'STOREFRONT_NOT_CONFIGURED',
      );
    if (
      req.query.merchantId !== undefined &&
      req.query.merchantId !== storefrontMerchantId
    )
      throw new AppError('This API serves a single store', 403, 'FORBIDDEN');
    return storefrontMerchantId;
  }
  async function resolveAdmin(req) {
    await requireStoreAdmin(req, storefrontMerchantId);
    return resolveStorefront(req);
  }
  return { resolveAdmin, resolveStorefront };
}
module.exports = { createMerchantContext };
