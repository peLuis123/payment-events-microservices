const { PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

function sanitizeKey(value) {
  return String(value).replace(/[^A-Za-z0-9_-]/g, '_');
}

/**
 * Creates the DynamoDB repository for payment results.
 *
 * @param {{ client: object, tableName: string }} dependencies - DynamoDB client and table.
 * @returns {{ savePaymentResult: Function, hasProcessed: Function }} Repository methods.
 */
function createOrderRepository({ client, tableName }) {
  async function savePaymentResult({ eventId, order, payment }) {
    const safeEventId = sanitizeKey(eventId);
    try {
      await client.send(new PutCommand({
        TableName: tableName,
        Item: {
          eventId: safeEventId,
          orderId: sanitizeKey(order.orderId),
          customerId: sanitizeKey(order.customerId),
          amount: order.amount,
          currency: order.currency,
          status: payment.status,
          reason: payment.reason,
          processedAt: new Date().toISOString()
        },
        ConditionExpression: 'attribute_not_exists(eventId)'
      }));
    } catch (error) {
      if (error.name === 'ConditionalCheckFailedException') {
        return { status: 'duplicate', eventId: safeEventId };
      }
      throw error;
    }
    return { status: 'saved', eventId: safeEventId };
  }

  async function hasProcessed(eventId) {
    const response = await client.send(new GetCommand({
      TableName: tableName,
      Key: { eventId: sanitizeKey(eventId) },
      ProjectionExpression: 'eventId'
    }));
    return Boolean(response.Item);
  }

  return { savePaymentResult, hasProcessed };
}

module.exports = { createOrderRepository, sanitizeKey };
