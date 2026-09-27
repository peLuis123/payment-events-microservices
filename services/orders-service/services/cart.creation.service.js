const { randomUUID } = require('node:crypto');

function createCartCreationService({ saveCart, createId = randomUUID }) {
  async function create({ userId, merchantId, currency }) {
    const now = new Date().toISOString();
    const cart = { cartId: createId(), userId, merchantId, currency, status: 'active', createdAt: now, updatedAt: now };
    await saveCart(cart);
    return cart;
  }
  return { create };
}
module.exports = { createCartCreationService };
