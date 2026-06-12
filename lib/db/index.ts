import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

// Use fallback URL to prevent build errors
// For local development, use a local SQLite file (without 'file:' prefix)
const databaseUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || './local.db';

const client = createClient({
  url: databaseUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
