const { PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

function createMerchantRepository({
  client,
  merchantsTable = 'Merchants',
  merchantUsersTable = 'MerchantUsers',
}) {
  return {
    getMembership: async (merchantId, userId) => {
      const result = await client.send(
        new GetCommand({
          TableName: merchantUsersTable,
          Key: { merchantId, userId },
          ConsistentRead: true,
        }),
      );
      return result.Item;
    },
    saveMerchant: async (merchant) => {
      await client.send(
        new PutCommand({
          TableName: merchantsTable,
          Item: merchant,
          ConditionExpression: 'attribute_not_exists(merchantId)',
        }),
      );
      return { status: 'saved', merchantId: merchant.merchantId };
    },
    saveMerchantUser: async (membership) => {
      await client.send(
        new PutCommand({ TableName: merchantUsersTable, Item: membership }),
      );
      return { status: 'saved' };
    },
  };
}

module.exports = { createMerchantRepository };
