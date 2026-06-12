import { db } from '~/lib/db';
import { users, sessions, accounts, credits } from '~/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
}

export interface Session {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
  user: User;
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function generateSessionToken(): Promise<string> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function generateId(): Promise<string> {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function createSession(userId: string): Promise<string> {
  const sessionToken = await generateSessionToken();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await db.insert(sessions).values({
    sessionToken,
    userId,
    expires,
  });

  return sessionToken;
}

export async function getSession(sessionToken: string): Promise<Session | null> {
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.sessionToken, sessionToken),
    with: {
      user: true,
    },
  });

  if (!session || session.expires < new Date()) {
    return null;
  }

  return session as Session;
}

export async function deleteSession(sessionToken: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
}

export async function getUserFromGoogle(
  accessToken: string,
  refreshToken: string
): Promise<User> {
  // Get Google user info
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const googleUser = await response.json();

  // Find or create user
  let user = await db.query.users.findFirst({
    where: eq(users.email, googleUser.email),
  });

  if (!user) {
    const userId = await generateId();
    await db.insert(users).values({
      id: userId,
      name: googleUser.name,
      email: googleUser.email,
      image: googleUser.picture,
      emailVerified: new Date(),
    });

    // Create credit account
    await db.insert(credits).values({
      id: await generateId(),
      userId,
      balance: 100,
      monthlyQuota: 100,
      quotaResetAt: new Date(),
    });

    user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
  }

  // Save OAuth account info
  await db.insert(accounts).values({
    id: await generateId(),
    userId: user!.id,
    type: 'oauth',
    provider: 'google',
    providerAccountId: googleUser.id,
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return user!;
}

export async function getCurrentUser(request: Request): Promise<User | null> {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const sessionToken = cookieHeader
    .split(';')
    .find((c) => c.trim().startsWith('session_token='))
    ?.split('=')[1];

  if (!sessionToken) return null;

  const session = await getSession(sessionToken);
  return session?.user || null;
}
