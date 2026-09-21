const { GetCommand, PutCommand, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

function createCommerceRepository({ client, tables = {} }) {
  const table = (name, fallback) => tables[name] || fallback;
  async function save(tableName, item, key) {
    await client.send(new PutCommand({ TableName: tableName, Item: item, ConditionExpression: `attribute_not_exists(${key})` }));
    return { status: 'saved' };
  }
  async function get(tableName, keyName, keyValue) {
    const result = await client.send(new GetCommand({ TableName: tableName, Key: { [keyName]: keyValue } }));
    return result.Item;
  }
  async function list(tableName, indexName, merchantId) {
    const result = await client.send(new QueryCommand({ TableName: tableName, IndexName: indexName, KeyConditionExpression: 'merchantId = :merchantId', ExpressionAttributeValues: { ':merchantId': merchantId } }));
    return result.Items || [];
  }
  return {
    saveCart: (item) => save(table('carts', 'Carts'), item, 'cartId'),
    getCart: (id) => get(table('carts', 'Carts'), 'cartId', id),
    saveCartItem: (item) => save(table('cartItems', 'CartItems'), item, 'cartItemId'),
    getCartItems: async (cartId) => { const result = await client.send(new QueryCommand({ TableName: table('cartItems', 'CartItems'), IndexName: 'CartIndex', KeyConditionExpression: 'cartId = :cartId', ExpressionAttributeValues: { ':cartId': cartId } })); return result.Items || []; },
    saveOrder: (item) => save(table('orders', 'CommercialOrders'), item, 'orderId'),
    saveOrderItems: async (items) => { for (const item of items) await save(table('orderItems', 'OrderItems'), item, 'lineItemId'); return { status: 'saved' }; },
    getOrderItems: async (orderId) => { const result = await client.send(new QueryCommand({ TableName: table('orderItems', 'OrderItems'), IndexName: 'OrderIndex', KeyConditionExpression: 'orderId = :orderId', ExpressionAttributeValues: { ':orderId': orderId } })); return result.Items || []; },
    getOrder: (id) => get(table('orders', 'CommercialOrders'), 'orderId', id),
    listOrders: (merchantId) => list(table('orders', 'CommercialOrders'), 'MerchantIndex', merchantId),
    reserveInventory: async ({ productId, quantity }) => {
      await client.send(new UpdateCommand({ TableName: table('inventory', 'Inventory'), Key: { productId }, UpdateExpression: 'ADD availableQuantity :delta, reservedQuantity :quantity', ConditionExpression: 'attribute_exists(availableQuantity) AND availableQuantity >= :quantity', ExpressionAttributeValues: { ':delta': -quantity, ':quantity': quantity } }));
      return { status: 'reserved' };
    }
  };
}
module.exports = { createCommerceRepository };
