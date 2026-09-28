const { AppError } = require('../middlewares/error.middleware');
const {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  TransactWriteCommand,
} = require('@aws-sdk/lib-dynamodb');

function createCommerceRepository({ client, tables = {} }) {
  const table = (name, fallback) => tables[name] || fallback;
  async function save(tableName, item, key) {
    await client.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
        ConditionExpression: `attribute_not_exists(${key})`,
      }),
    );
    return { status: 'saved' };
  }
  async function get(tableName, keyName, keyValue) {
    const result = await client.send(
      new GetCommand({
        TableName: tableName,
        Key: { [keyName]: keyValue },
        ConsistentRead: true,
      }),
    );
    return result.Item;
  }
  async function list(tableName, indexName, merchantId) {
    const result = await client.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: 'merchantId = :merchantId',
        ExpressionAttributeValues: { ':merchantId': merchantId },
      }),
    );
    return result.Items || [];
  }
  return {
    saveCart: (item) => save(table('carts', 'Carts'), item, 'cartId'),
    getCart: (id) => get(table('carts', 'Carts'), 'cartId', id),
    saveCartItem: (item) =>
      save(table('cartItems', 'CartItems'), item, 'cartItemId'),
    getCartItems: async (cartId) => {
      const result = await client.send(
        new QueryCommand({
          TableName: table('cartItems', 'CartItems'),
          IndexName: 'CartIndex',
          KeyConditionExpression: 'cartId = :cartId',
          ExpressionAttributeValues: { ':cartId': cartId },
        }),
      );
      return result.Items || [];
    },
    saveOrder: (item) =>
      save(table('orders', 'CommercialOrders'), item, 'orderId'),
    saveOrderItems: async (items) => {
      for (const item of items)
        await save(table('orderItems', 'OrderItems'), item, 'lineItemId');
      return { status: 'saved' };
    },
    getOrderItems: async (orderId) => {
      const result = await client.send(
        new QueryCommand({
          TableName: table('orderItems', 'OrderItems'),
          IndexName: 'OrderIndex',
          KeyConditionExpression: 'orderId = :orderId',
          ExpressionAttributeValues: { ':orderId': orderId },
        }),
      );
      return result.Items || [];
    },
    getOrder: (id) => get(table('orders', 'CommercialOrders'), 'orderId', id),
    listOrders: (merchantId) =>
      list(table('orders', 'CommercialOrders'), 'MerchantIndex', merchantId),
    listOrdersByUser: async (userId) => {
      const result = await client.send(
        new QueryCommand({
          TableName: table('orders', 'CommercialOrders'),
          IndexName: 'UserIndex',
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: { ':userId': userId },
        }),
      );
      return result.Items || [];
    },
    updateOrderPayment: async ({
      orderId,
      paymentId,
      paymentStatus,
      updatedAt,
    }) => {
      await client.send(
        new UpdateCommand({
          TableName: table('orders', 'CommercialOrders'),
          Key: { orderId },
          UpdateExpression:
            'SET paymentId = :paymentId, paymentStatus = :status, updatedAt = :now',
          ConditionExpression: 'attribute_exists(orderId)',
          ExpressionAttributeValues: {
            ':paymentId': paymentId,
            ':status': paymentStatus,
            ':now': updatedAt,
          },
        }),
      );
    },
    addCartItem: async ({ cart, product, quantity }) => {
      const cartItemId = cart.cartId + ':' + product.productId;
      const existing = await client.send(
        new GetCommand({
          TableName: table('cartItems', 'CartItems'),
          Key: { cartItemId },
          ConsistentRead: true,
        }),
      );
      const previous = existing.Item;
      const nextQuantity = (previous?.quantity || 0) + quantity;
      if (
        !Number.isSafeInteger(nextQuantity) ||
        (Number.isSafeInteger(product.stock) && nextQuantity > product.stock)
      )
        throw new AppError('Insufficient stock', 409, 'INSUFFICIENT_STOCK');
      const now = new Date().toISOString();
      const item = {
        cartItemId,
        cartId: cart.cartId,
        productId: product.productId,
        productName: product.name,
        imageUrl: product.imageUrl || '',
        quantity: nextQuantity,
        unitAmount: product.price,
        totalAmount: product.price * nextQuantity,
        createdAt: previous?.createdAt || now,
        updatedAt: now,
      };
      await client.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              ConditionCheck: {
                TableName: table('carts', 'Carts'),
                Key: { cartId: cart.cartId },
                ConditionExpression:
                  'userId = :user AND merchantId = :merchant AND #status = :active',
                ExpressionAttributeNames: { '#status': 'status' },
                ExpressionAttributeValues: {
                  ':user': cart.userId,
                  ':merchant': cart.merchantId,
                  ':active': 'active',
                },
              },
            },
            {
              Put: {
                TableName: table('cartItems', 'CartItems'),
                Item: item,
                ConditionExpression: previous
                  ? 'quantity = :previous'
                  : 'attribute_not_exists(cartItemId)',
                ...(previous
                  ? {
                      ExpressionAttributeValues: {
                        ':previous': previous.quantity,
                      },
                    }
                  : {}),
              },
            },
          ],
        }),
      );
    },
    setCartItem: async ({ cart, product, quantity }) => {
      await client.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              ConditionCheck: {
                TableName: table('carts', 'Carts'),
                Key: { cartId: cart.cartId },
                ConditionExpression: 'userId = :user AND #status = :active',
                ExpressionAttributeNames: { '#status': 'status' },
                ExpressionAttributeValues: {
                  ':user': cart.userId,
                  ':active': 'active',
                },
              },
            },
            {
              Update: {
                TableName: table('cartItems', 'CartItems'),
                Key: { cartItemId: cart.cartId + ':' + product.productId },
                UpdateExpression:
                  'SET quantity = :qty, unitAmount = :price, totalAmount = :total, updatedAt = :now',
                ConditionExpression: 'attribute_exists(cartItemId)',
                ExpressionAttributeValues: {
                  ':qty': quantity,
                  ':price': product.price,
                  ':total': product.price * quantity,
                  ':now': new Date().toISOString(),
                },
              },
            },
          ],
        }),
      );
    },
    removeCartItem: async ({ cart, productId }) => {
      await client.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              ConditionCheck: {
                TableName: table('carts', 'Carts'),
                Key: { cartId: cart.cartId },
                ConditionExpression: 'userId = :user AND #status = :active',
                ExpressionAttributeNames: { '#status': 'status' },
                ExpressionAttributeValues: {
                  ':user': cart.userId,
                  ':active': 'active',
                },
              },
            },
            {
              Delete: {
                TableName: table('cartItems', 'CartItems'),
                Key: { cartItemId: cart.cartId + ':' + productId },
              },
            },
          ],
        }),
      );
    },
    getCartItem: (cartId, productId) =>
      get(
        table('cartItems', 'CartItems'),
        'cartItemId',
        cartId + ':' + productId,
      ),
    reserveInventory: async ({ orderId, items }) => {
      await client.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Update: {
                TableName: table('orders', 'CommercialOrders'),
                Key: { orderId },
                UpdateExpression: 'SET inventoryStatus = :reserved',
                ConditionExpression:
                  'attribute_exists(orderId) AND attribute_not_exists(inventoryStatus) AND orderStatus = :pending',
                ExpressionAttributeValues: {
                  ':reserved': 'reserved',
                  ':pending': 'pending',
                },
              },
            },
            ...items.flatMap(({ productId, quantity }) => [
              {
                Update: {
                  TableName: table('inventory', 'Inventory'),
                  Key: { productId },
                  UpdateExpression:
                    'ADD availableQuantity :delta, reservedQuantity :quantity',
                  ConditionExpression:
                    'attribute_exists(availableQuantity) AND availableQuantity >= :quantity',
                  ExpressionAttributeValues: {
                    ':delta': -quantity,
                    ':quantity': quantity,
                  },
                },
              },
              {
                Update: {
                  TableName: table('products', 'Products'),
                  Key: { productId },
                  UpdateExpression: 'ADD stock :delta',
                  ConditionExpression:
                    '#status = :active AND stock >= :quantity',
                  ExpressionAttributeNames: { '#status': 'status' },
                  ExpressionAttributeValues: {
                    ':delta': -quantity,
                    ':quantity': quantity,
                    ':active': 'active',
                  },
                },
              },
            ]),
          ],
        }),
      );
      return { status: 'reserved' };
    },
  };
}
module.exports = { createCommerceRepository };
