const { DeleteCommand, GetCommand, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

function createCatalogRepository({ client, productsTable = 'Products', categoriesTable = 'Categories' }) {
  function make(tableName, key) {
    return {
      save: async (item) => {
        await client.send(new PutCommand({ TableName: tableName, Item: item, ConditionExpression: `attribute_not_exists(${key})` }));
        return { status: 'saved', id: item[key] };
      },
      get: async (id, key) => {
        const result = await client.send(new GetCommand({ TableName: tableName, Key: { [key]: id } }));
        return result.Item;
      },
      listByMerchant: async (merchantId) => {
        const result = await client.send(new QueryCommand({
          TableName: tableName,
          IndexName: 'MerchantIndex',
          KeyConditionExpression: 'merchantId = :merchantId',
          ExpressionAttributeValues: { ':merchantId': merchantId }
        }));
        return result.Items || [];
      },
      remove: async (id, key) => client.send(new DeleteCommand({ TableName: tableName, Key: { [key]: id } }))
    };
  }
  const products = make(productsTable, 'productId');
  const categories = make(categoriesTable, 'categoryId');
  return {
    saveProduct: products.save,
    getProduct: (id) => products.get(id, 'productId'),
    listProducts: products.listByMerchant,
    deleteProduct: (id) => products.remove(id, 'productId'),
    saveCategory: categories.save,
    getCategory: (id) => categories.get(id, 'categoryId'),
    listCategories: categories.listByMerchant,
    deleteCategory: (id) => categories.remove(id, 'categoryId')
  };
}

module.exports = { createCatalogRepository };
