import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.TURSO_URL || 'file:recyfi.db',
    authToken: process.env.TURSO_TOKEN,
  },
});