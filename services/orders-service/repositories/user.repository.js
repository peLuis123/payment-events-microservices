const { GetCommand, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

function createUserRepository({ client, tableName = 'Users', refreshTableName = 'RefreshTokens' }) {
  async function saveUser(user) {
    await client.send(new PutCommand({
      TableName: tableName,
      Item: user,
      ConditionExpression: 'attribute_not_exists(userId)'
    }));
    return { status: 'saved', userId: user.userId };
  }

  async function getUserByEmail(email) {
    const result = await client.send(new QueryCommand({
      TableName: tableName,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email }
    }));
    return result.Items?.[0];
  }

  async function saveRefreshToken(token) {
    await client.send(new PutCommand({ TableName: refreshTableName, Item: token }));
    return { status: 'saved' };
  }

  async function getUser(userId) {
    const result = await client.send(new GetCommand({ TableName: tableName, Key: { userId } }));
    return result.Item;
  }

  return { saveUser, getUserByEmail, saveRefreshToken, getUser };
}

module.exports = { createUserRepository };
