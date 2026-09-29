const fs = require('fs');
const yaml = require('js-yaml');
const config = yaml.load(
  fs.readFileSync(require('path').join(__dirname, '../serverless.yml'), 'utf8'),
);
test('buyer history index is declared on commercial orders', () => {
  const table = config.resources.Resources.CommercialOrdersTable.Properties;
  expect(table.AttributeDefinitions).toContainEqual({
    AttributeName: 'userId',
    AttributeType: 'S',
  });
  expect(table.GlobalSecondaryIndexes).toContainEqual(
    expect.objectContaining({
      IndexName: 'UserIndex',
      KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
    }),
  );
});
test('runtime can update inventory and access the commerce tables and indexes', () => {
  const policy = config.provider.iam.role.statements.find((s) =>
    s.Action.includes('dynamodb:GetItem'),
  );
  expect(policy.Action).toEqual(
    expect.arrayContaining([
      'dynamodb:UpdateItem',
      'dynamodb:ConditionCheckItem',
    ]),
  );
  for (const resource of [
    "CartItems'}",
    "CommercialOrders'}",
    "CommercialOrders'}/index/UserIndex",
    "OrderItems'}/index/OrderIndex",
  ])
    expect(policy.Resource.some((r) => r.endsWith(resource))).toBe(true);
});

test('merchant membership user index has query permissions', () => {
  expect(
    config.resources.Resources.MerchantUsersTable.Properties
      .GlobalSecondaryIndexes,
  ).toContainEqual(
    expect.objectContaining({
      IndexName: 'UserIndex',
      KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
    }),
  );
  const policy = config.provider.iam.role.statements.find((s) =>
    s.Action.includes('dynamodb:Query'),
  );
  expect(
    policy.Resource.some((r) => r.includes("MerchantUsers'}/index/UserIndex")),
  ).toBe(true);
});
