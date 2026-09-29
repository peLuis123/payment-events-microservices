const {
  PutCommand,
  GetCommand,
  QueryCommand,
} = require('@aws-sdk/lib-dynamodb');

function createMerchantRepository({
  client,
  merchantsTable = 'Merchants',
  merchantUsersTable = 'MerchantUsers',
}) {
  return {
    getMerchant: async (merchantId) =>
      (
        await client.send(
          new GetCommand({
            TableName: merchantsTable,
            Key: { merchantId },
            ConsistentRead: true,
          }),
        )
      ).Item,
    listMemberships: async (userId) => {
      const items = [];
      let cursor;
      do {
        const page = await client.send(
          new QueryCommand({
            TableName: merchantUsersTable,
            IndexName: 'UserIndex',
            KeyConditionExpression: 'userId = :user',
            ExpressionAttributeValues: { ':user': userId },
            ExclusiveStartKey: cursor,
          }),
        );
        items.push(...(page.Items || []));
        cursor = page.LastEvaluatedKey;
      } while (cursor);
      return items;
    },
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
