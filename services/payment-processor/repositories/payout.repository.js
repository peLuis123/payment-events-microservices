const { GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

function createPayoutRepository({ client, tableName, now = () => new Date().toISOString() }) {
  async function save(payout) {
    await client.send(new PutCommand({
      TableName: tableName,
      Item: { ...payout, createdAt: payout.createdAt || now(), updatedAt: now() },
      ConditionExpression: 'attribute_not_exists(payoutId)'
    }));
    return { status: 'saved', payoutId: payout.payoutId };
  }

  async function get(payoutId) {
    const result = await client.send(new GetCommand({
      TableName: tableName,
      Key: { payoutId }
    }));
    return result.Item;
  }

  return { save, get };
}

module.exports = { createPayoutRepository };
