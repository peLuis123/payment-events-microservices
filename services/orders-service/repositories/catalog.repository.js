const {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  TransactWriteCommand,
} = require('@aws-sdk/lib-dynamodb');
const { AppError } = require('../middlewares/error.middleware');
function createCatalogRepository({
  client,
  productsTable = 'Products',
  categoriesTable = 'Categories',
  inventoryTable = 'Inventory',
}) {
  const conflict = (error) => {
    if (
      [
        'ConditionalCheckFailedException',
        'TransactionCanceledException',
      ].includes(error.name)
    )
      throw new AppError('Resource changed; reload and retry', 409, 'CONFLICT');
    throw error;
  };
  async function get(table, key) {
    const result = await client.send(
      new GetCommand({ TableName: table, Key: key, ConsistentRead: true }),
    );
    return result.Item;
  }
  async function list(table, merchantId) {
    const items = [];
    let cursor;
    do {
      const result = await client.send(
        new QueryCommand({
          TableName: table,
          IndexName: 'MerchantIndex',
          KeyConditionExpression: 'merchantId = :merchant',
          ExpressionAttributeValues: { ':merchant': merchantId },
          ...(cursor ? { ExclusiveStartKey: cursor } : {}),
        }),
      );
      items.push(...(result.Items || []));
      cursor = result.LastEvaluatedKey;
    } while (cursor);
    return items;
  }
  async function patch(table, keyName, current, changes) {
    const names = { '#merchant': 'merchantId' };
    const values = { ':merchant': current.merchantId };
    const updates = Object.entries(changes).map(([key, value], i) => {
      names['#f' + i] = key;
      values[':v' + i] = value;
      return '#f' + i + ' = :v' + i;
    });
    try {
      const result = await client.send(
        new UpdateCommand({
          TableName: table,
          Key: { [keyName]: current[keyName] },
          UpdateExpression: 'SET ' + updates.join(', '),
          ConditionExpression:
            'attribute_exists(' + keyName + ') AND #merchant = :merchant',
          ExpressionAttributeNames: names,
          ExpressionAttributeValues: values,
          ReturnValues: 'ALL_NEW',
        }),
      );
      return result.Attributes;
    } catch (error) {
      conflict(error);
    }
  }
  return {
    saveProduct: async (product) => {
      await client.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Put: {
                TableName: productsTable,
                Item: product,
                ConditionExpression: 'attribute_not_exists(productId)',
              },
            },
            {
              Put: {
                TableName: inventoryTable,
                Item: {
                  productId: product.productId,
                  merchantId: product.merchantId,
                  availableQuantity: product.stock,
                  reservedQuantity: 0,
                  updatedAt: product.updatedAt,
                },
                ConditionExpression: 'attribute_not_exists(productId)',
              },
            },
          ],
        }),
      );
    },
    getProduct: (id) => get(productsTable, { productId: id }),
    listProducts: (id) => list(productsTable, id),
    patchProduct: (current, changes) =>
      patch(productsTable, 'productId', current, changes),
    saveCategory: async (category) =>
      client.send(
        new PutCommand({
          TableName: categoriesTable,
          Item: category,
          ConditionExpression: 'attribute_not_exists(categoryId)',
        }),
      ),
    getCategory: (id) => get(categoriesTable, { categoryId: id }),
    listCategories: (id) => list(categoriesTable, id),
    patchCategory: (current, changes) =>
      patch(categoriesTable, 'categoryId', current, changes),
    getInventory: (id) => get(inventoryTable, { productId: id }),
    updateInventory: async (
      product,
      { availableQuantity, expectedAvailableQuantity },
    ) => {
      const now = new Date().toISOString();
      try {
        await client.send(
          new TransactWriteCommand({
            TransactItems: [
              {
                Update: {
                  TableName: inventoryTable,
                  Key: { productId: product.productId },
                  UpdateExpression:
                    'SET availableQuantity = :available, reservedQuantity = if_not_exists(reservedQuantity, :zero), merchantId = :merchant, updatedAt = :now',
                  ConditionExpression:
                    '(attribute_not_exists(productId) AND :expected = :zero) OR (availableQuantity = :expected AND (attribute_not_exists(merchantId) OR merchantId = :merchant))',
                  ExpressionAttributeValues: {
                    ':available': availableQuantity,
                    ':expected': expectedAvailableQuantity,
                    ':zero': 0,
                    ':merchant': product.merchantId,
                    ':now': now,
                  },
                },
              },
              {
                Update: {
                  TableName: productsTable,
                  Key: { productId: product.productId },
                  UpdateExpression: 'SET stock = :available, updatedAt = :now',
                  ConditionExpression:
                    'attribute_exists(productId) AND merchantId = :merchant',
                  ExpressionAttributeValues: {
                    ':available': availableQuantity,
                    ':merchant': product.merchantId,
                    ':now': now,
                  },
                },
              },
            ],
          }),
        );
      } catch (error) {
        conflict(error);
      }
      return get(inventoryTable, { productId: product.productId });
    },
  };
}
module.exports = { createCatalogRepository };
