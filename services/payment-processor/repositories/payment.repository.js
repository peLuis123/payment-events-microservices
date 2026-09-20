const { GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

function createPaymentRepository({ client, tableName }) {
  async function save(payment) {
    await client.send(new PutCommand({
      TableName: tableName,
      Item: {
        ...payment,
        updatedAt: new Date().toISOString(),
        createdAt: payment.createdAt || new Date().toISOString()
      },
      ConditionExpression: 'attribute_not_exists(paymentId) OR providerEventId <> :providerEventId',
      ExpressionAttributeValues: {
        ':providerEventId': payment.providerEventId
      }
    }));

    return { status: 'saved', paymentId: payment.paymentId };
  }

  async function get(paymentId) {
    const result = await client.send(new GetCommand({
      TableName: tableName,
      Key: { paymentId }
    }));
    return result.Item;
  }

  return { save, get };
}

module.exports = { createPaymentRepository };
