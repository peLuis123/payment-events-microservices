function createAuthController({ authService }) {
  function setAuthCookies(response, result) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    response.setHeader('Set-Cookie', [
      `access_token=${result.accessToken}; HttpOnly; Path=/; Max-Age=900; SameSite=Lax${secure}`,
      `refresh_token=${result.refreshToken}; HttpOnly; Path=/auth; Max-Age=2592000; SameSite=Lax${secure}`
    ]);
  }

  return {
    register: async (request, response, next) => {
      try {
        const { email, password, displayName } = request.body || {};
        if (!email || !password || password.length < 8) {
          response.status(400).json({ error: 'Invalid registration request', code: 'INVALID_REGISTRATION' });
          return;
        }
        const user = await authService.register({ email, password, displayName });
        response.status(201).json(user);
      } catch (error) { next(error); }
    },
    login: async (request, response, next) => {
      try {
        const result = await authService.login(request.body || {});
        setAuthCookies(response, result);
        response.status(200).json({ user: result.user });
      } catch (error) { next(error); }
    }
  };
}

module.exports = { createAuthController };
