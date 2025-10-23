import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema.js';

const turso = createClient({
  url: process.env.TURSO_URL || 'file:recyfi.db',
  authToken: process.env.TURSO_TOKEN,
});

export const db = drizzle(turso, { schema });

export { schema };