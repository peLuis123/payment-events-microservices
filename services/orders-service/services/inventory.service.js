function createInventoryService({ reserve }) {
  async function reserveStock(request) {
    await reserve(request);
    return { status: 'reserved', productId: request.productId };
  }
  return { reserve: reserveStock };
}
module.exports = { createInventoryService };
