const { QueryCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { createUserRepository } = require('../repositories/user.repository');

describe('createUserRepository', () => {
  test('persists users and queries by email', async () => {
    const client = {
      send: jest.fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ Items: [{ userId: 'user-123', email: 'buyer@example.com' }] })
    };
    const repository = createUserRepository({ client });

    await expect(repository.saveUser({ userId: 'user-123', email: 'buyer@example.com' }))
      .resolves.toEqual({ status: 'saved', userId: 'user-123' });
    await expect(repository.getUserByEmail('buyer@example.com'))
      .resolves.toEqual({ userId: 'user-123', email: 'buyer@example.com' });
    expect(client.send.mock.calls[0][0]).toEqual(expect.any(PutCommand));
    expect(client.send.mock.calls[1][0]).toEqual(expect.any(QueryCommand));
  });
});
