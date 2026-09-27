const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { createUserRepository } = require('../repositories/user.repository');
const { createAuthService } = require('../services/auth.service');
const { randomUUID } = require('node:crypto');

async function main() {
  const email = "pedrorc2018@gmail.com";
  const password = "nevermore123";
  if (!email || !password || password.length < 8) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD with at least 8 characters are required');
  }

  const client = DynamoDBDocumentClient.from(new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-2'
  }));
  const repository = createUserRepository({
    client,
    tableName: process.env.USERS_TABLE || 'Users',
    refreshTableName: process.env.REFRESH_TOKENS_TABLE || 'RefreshTokens'
  });
  const auth = createAuthService({
    getUserByEmail: repository.getUserByEmail,
    saveUser: repository.saveUser,
    createUserId: randomUUID
  });
  const existing = await repository.getUserByEmail(email);
  if (existing) {
    throw new Error(`User already exists: ${email}`);
  }

  const passwordHash = await auth.hashPassword(password);
  const user = {
    userId: randomUUID(),
    email,
    role: 'admin',
    status: 'active',
    passwordHash,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await repository.saveUser(user);
  console.log(`Admin created: ${email}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
