import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

// For Cloudflare Workers, use HTTP client
// For local development, you can use file-based SQLite
const databaseUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || './local.db';

const client = createClient({
  url: databaseUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
