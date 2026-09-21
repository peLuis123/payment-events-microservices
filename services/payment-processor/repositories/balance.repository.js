const { GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

function createBalanceRepository({ client, tableName, now = () => new Date().toISOString() }) {
  async function update({ merchantId, currency, pendingDelta = 0, availableDelta = 0 }) {
    await client.send(new UpdateCommand({
      TableName: tableName,
      Key: { accountId: merchantId },
      UpdateExpression: 'SET #currency = if_not_exists(#currency, :currency), updatedAt = :updatedAt ADD #pending :pendingDelta, #available :availableDelta',
      ConditionExpression: '(:pendingDelta >= :zero OR (attribute_exists(#pending) AND #pending >= :pendingDebit)) AND (:availableDelta >= :zero OR (attribute_exists(#available) AND #available >= :availableDebit))',
      ExpressionAttributeNames: {
        '#currency': 'currency',
        '#pending': 'pending',
        '#available': 'available'
      },
      ExpressionAttributeValues: {
        ':currency': currency,
        ':updatedAt': now(),
        ':pendingDelta': pendingDelta,
        ':availableDelta': availableDelta,
        ':pendingDebit': Math.abs(pendingDelta),
        ':availableDebit': Math.abs(availableDelta),
        ':zero': 0
      }
    }));
    return { status: 'updated', merchantId };
  }

  async function get(merchantId) {
    const result = await client.send(new GetCommand({
      TableName: tableName,
      Key: { accountId: merchantId }
    }));
    return result.Item;
  }

  return { update, get };
}

module.exports = { createBalanceRepository };
