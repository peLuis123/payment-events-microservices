const { randomUUID } = require('node:crypto');

function createMerchantService({ saveMerchant, saveMerchantUser, createId = randomUUID }) {
  async function create(request) {
    if (!request.ownerUserId || !request.name?.trim() || !/^[A-Z]{3}$/.test(request.defaultCurrency || '')) {
      const error = new Error('Invalid merchant');
      error.code = 'INVALID_MERCHANT';
      throw error;
    }
    const merchant = {
      merchantId: createId(),
      name: request.name.trim(),
      status: 'active',
      ownerUserId: request.ownerUserId,
      defaultCurrency: request.defaultCurrency,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await saveMerchant(merchant);
    await saveMerchantUser({ merchantId: merchant.merchantId, userId: request.ownerUserId, role: 'admin', status: 'active', createdAt: merchant.createdAt });
    return merchant;
  }
  return { create };
}

module.exports = { createMerchantService };
