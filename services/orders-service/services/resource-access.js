const { AppError } = require('../middlewares/error.middleware');
function requireUser(request) {
  if (!request.user?.userId)
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  return request.user.userId;
}
function requireOwner(request, resource) {
  const userId = requireUser(request);
  if (!resource) throw new AppError('Resource not found', 404, 'NOT_FOUND');
  if (
    resource.userId !== userId ||
    (request.merchantId && request.merchantId !== resource.merchantId)
  ) {
    throw new AppError('Access denied', 403, 'FORBIDDEN');
  }
  return resource;
}
async function requireStoreAdmin(request, merchantId) {
  requireUser(request);
  if (!merchantId || request.user.role !== 'admin')
    throw new AppError('Admin access required', 403, 'FORBIDDEN');
  if (merchantId !== request.storefrontMerchantId)
    throw new AppError('Merchant access denied', 403, 'FORBIDDEN');
}
module.exports = { requireUser, requireOwner, requireStoreAdmin };
