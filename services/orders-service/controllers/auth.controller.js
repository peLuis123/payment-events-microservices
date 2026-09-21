function createAuthController({ authService }) {
  function cookieValue(request, name) {
    const cookies = Object.fromEntries((request.headers.cookie || '').split(';').filter(Boolean).map((part) => part.trim().split('=')));
    return cookies[name];
  }

  function setAuthCookies(response, result) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    const sameSite = process.env.NODE_ENV === 'production' ? 'None' : 'Lax';
    response.setHeader('Set-Cookie', [
      `access_token=${result.accessToken}; HttpOnly; Path=/; Max-Age=900; SameSite=${sameSite}${secure}`,
      `refresh_token=${result.refreshToken}; HttpOnly; Path=/auth; Max-Age=2592000; SameSite=${sameSite}${secure}`
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
    },
    me: async (request, response, next) => {
      try {
        if (!request.user?.userId) { response.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' }); return; }
        response.json(await authService.me(request.user.userId));
      } catch (error) { next(error); }
    },
    refresh: async (request, response, next) => {
      try { const result = await authService.refresh(cookieValue(request, 'refresh_token')); setAuthCookies(response, result); response.json({ user: result.user }); } catch (error) { next(error); }
    },
    logout: async (request, response, next) => {
      try { await authService.logout(cookieValue(request, 'refresh_token')); response.setHeader('Set-Cookie', ['access_token=; HttpOnly; Path=/; Max-Age=0', 'refresh_token=; HttpOnly; Path=/auth; Max-Age=0']); response.status(204).send(); } catch (error) { next(error); }
    }
  };
}

module.exports = { createAuthController };
