const { GetCommand, TransactWriteCommand } = require('@aws-sdk/lib-dynamodb');

function createAccountingRepository({ client, ledgerTableName, balanceTableName, now = () => new Date().toISOString() }) {
  async function recordTransaction(transaction) {
    const existingEntry = await client.send(new GetCommand({
      TableName: ledgerTableName,
      Key: { entryId: `${transaction.transactionId}:0` }
    }));
    if (existingEntry.Item) {
      return { status: 'duplicate', transactionId: transaction.transactionId };
    }

    const timestamp = now();
    const ledgerItems = transaction.entries.map((entry, index) => ({
      Put: {
        TableName: ledgerTableName,
        Item: {
          entryId: `${transaction.transactionId}:${index}`,
          transactionId: transaction.transactionId,
          paymentId: transaction.paymentId,
          userId: transaction.userId,
          commercialOrderId: transaction.commercialOrderId,
          merchantId: transaction.merchantId,
          accountId: entry.accountId,
          direction: entry.direction,
          amount: transaction.amount,
          currency: transaction.currency,
          type: transaction.type,
          createdAt: timestamp
        },
        ConditionExpression: 'attribute_not_exists(entryId)'
      }
    }));

    ledgerItems.push({
      Update: {
        TableName: balanceTableName,
        Key: { accountId: transaction.merchantId },
        UpdateExpression: 'SET #currency = if_not_exists(#currency, :currency), updatedAt = :updatedAt ADD available :delta',
        ConditionExpression: ':delta >= :zero OR (attribute_exists(available) AND available >= :debit)',
        ExpressionAttributeNames: { '#currency': 'currency' },
        ExpressionAttributeValues: {
          ':currency': transaction.currency,
          ':updatedAt': timestamp,
          ':delta': transaction.balanceDelta,
          ':debit': Math.abs(transaction.balanceDelta),
          ':zero': 0
        }
      }
    });

    await client.send(new TransactWriteCommand({ TransactItems: ledgerItems }));
    return { status: 'recorded', transactionId: transaction.transactionId };
  }

  async function getBalance(merchantId) {
    const result = await client.send(new GetCommand({
      TableName: balanceTableName,
      Key: { accountId: merchantId }
    }));
    return result.Item;
  }

  return { recordTransaction, getBalance };
}

module.exports = { createAccountingRepository };
