const { GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

function createRefundRepository({ client, tableName }) {
  async function save(refund) {
    await client.send(new PutCommand({
      TableName: tableName,
      Item: {
        ...refund,
        updatedAt: new Date().toISOString(),
        createdAt: refund.createdAt || new Date().toISOString()
      },
      ConditionExpression: 'attribute_not_exists(refundId)'
    }));
    return { status: 'saved', refundId: refund.refundId };
  }

  async function get(refundId) {
    const result = await client.send(new GetCommand({
      TableName: tableName,
      Key: { refundId }
    }));
    return result.Item;
  }

  return { save, get };
}

module.exports = { createRefundRepository };
