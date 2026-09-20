const { PutCommand } = require('@aws-sdk/lib-dynamodb');

function createProviderEventRepository({ client, tableName } = {}) {
  const events = new Set();
  return {
    async has(provider, providerEventId) {
      if (client) return false;
      return events.has(`${provider}:${providerEventId}`);
    },
    async claim(provider, providerEventId) {
      const key = `${provider}:${providerEventId}`;
      if (client) {
        try {
          await client.send(new PutCommand({
            TableName: tableName,
            Item: { providerEventId: key, provider, processedAt: new Date().toISOString() },
            ConditionExpression: 'attribute_not_exists(providerEventId)'
          }));
          return true;
        } catch (error) {
          if (error.name === 'ConditionalCheckFailedException') return false;
          throw error;
        }
      }
      if (events.has(key)) return false;
      events.add(key);
      return true;
    }
  };
}

module.exports = { createProviderEventRepository };
