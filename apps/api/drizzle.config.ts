import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

/**
 * drizzle-kit configuration.
 *
 * Migrations are generated into ./drizzle and are git-tracked — production
 * relies on migration history, not `db:push` (see 07_DEPLOYMENT.md pre-deploy
 * checklist). The schema file is empty until Batch 1.2 adds the first tables.
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
