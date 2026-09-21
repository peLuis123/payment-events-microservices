const { PutCommand } = require('@aws-sdk/lib-dynamodb');

function createMerchantRepository({ client, merchantsTable = 'Merchants', merchantUsersTable = 'MerchantUsers' }) {
  return {
    saveMerchant: async (merchant) => {
      await client.send(new PutCommand({ TableName: merchantsTable, Item: merchant, ConditionExpression: 'attribute_not_exists(merchantId)' }));
      return { status: 'saved', merchantId: merchant.merchantId };
    },
    saveMerchantUser: async (membership) => {
      await client.send(new PutCommand({ TableName: merchantUsersTable, Item: membership }));
      return { status: 'saved' };
    }
  };
}

module.exports = { createMerchantRepository };
