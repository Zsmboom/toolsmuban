import { createServerFn } from '@tanstack/react-start';
import { getSession, deleteSession, getUserFromGoogle, createSession, generateId } from '~/lib/auth';
import { getRequest } from '@tanstack/react-start/server';

export const getCurrentUserFn = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest();
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const sessionToken = cookieHeader
    .split(';')
    .find((c) => c.trim().startsWith('session_token='))
    ?.split('=')[1];

  if (!sessionToken) return null;

  const session = await getSession(sessionToken);
  return session?.user || null;
});

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const request = getRequest();
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return { success: false, error: 'No session found' };

  const sessionToken = cookieHeader
    .split(';')
    .find((c) => c.trim().startsWith('session_token='))
    ?.split('=')[1];

  if (!sessionToken) return { success: false, error: 'No session found' };

  await deleteSession(sessionToken);

  return { success: true };
});

export const googleLoginRedirectFn = createServerFn({ method: 'GET' }).handler(async () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured');
  }

  const redirectUri = `${process.env.VITE_APP_URL || 'http://localhost:3000'}/auth/callback`;
  const scope = 'openid email profile';
  const responseType = 'code';
  const accessType = 'offline';

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}&access_type=${accessType}&prompt=consent`;

  return { url: googleAuthUrl };
});

export const googleCallbackFn = createServerFn({ method: 'POST' })
  .validator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    const { code } = data;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials are not configured');
    }

    const redirectUri = `${process.env.VITE_APP_URL || 'http://localhost:3000'}/auth/callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token } = tokens;

    // Get user from Google
    const user = await getUserFromGoogle(access_token, refresh_token);

    // Create session
    const sessionToken = await createSession(user.id);

    return { sessionToken, user };
  });
