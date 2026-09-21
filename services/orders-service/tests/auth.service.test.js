const { createAuthService } = require('../services/auth.service');

describe('createAuthService', () => {
  test('registers a buyer without storing the raw password', async () => {
    const saveUser = jest.fn().mockResolvedValue({ userId: 'user-123' });
    const service = createAuthService({ saveUser, createUserId: () => 'user-123' });

    await expect(service.register({
      email: 'buyer@example.com',
      password: 'StrongPassword123!',
      displayName: 'Buyer'
    })).resolves.toMatchObject({
      userId: 'user-123',
      email: 'buyer@example.com',
      role: 'buyer'
    });
    expect(saveUser).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-123',
      email: 'buyer@example.com',
      role: 'buyer'
    }));
    expect(saveUser.mock.calls[0][0].passwordHash).not.toBe('StrongPassword123!');
  });

  test('logs in and issues access and refresh tokens', async () => {
    const user = { userId: 'user-123', email: 'buyer@example.com', role: 'buyer', passwordHash: 'hash' };
    const service = createAuthService({
      getUserByEmail: jest.fn().mockResolvedValue(user),
      verifyPassword: jest.fn().mockResolvedValue(true),
      saveRefreshToken: jest.fn().mockResolvedValue(undefined),
      signToken: jest.fn((payload) => `${payload.type}-token`)
    });

    await expect(service.login({ email: user.email, password: 'password' }))
      .resolves.toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token', user: expect.objectContaining({ userId: 'user-123' }) });
  });
});
