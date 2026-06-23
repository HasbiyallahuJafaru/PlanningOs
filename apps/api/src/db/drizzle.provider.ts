import { Pool } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

/** DI token for the Drizzle database instance. */
export const DRIZZLE = Symbol('DRIZZLE');

/** DI token for the underlying pg connection Pool (needed for clean shutdown). */
export const PG_POOL = Symbol('PG_POOL');

/** The Drizzle database type, bound to the project schema. */
export type Database = NodePgDatabase<typeof schema>;

/**
 * Creates the pg connection Pool from `DATABASE_URL`.
 *
 * Throws if `DATABASE_URL` is not set, rather than silently connecting to a
 * default — we never want the app pointing at an unintended database. See
 * .env.example for the expected format and 07_DEPLOYMENT.md for the EU/UK
 * region requirement on deployed datastores.
 */
export function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env and provide a connection string.',
    );
  }
  return new Pool({ connectionString });
}

/**
 * Wraps a pg Pool in a Drizzle instance bound to the project schema.
 *
 * @param pool - an active pg connection Pool.
 * @returns the typed Drizzle database instance.
 */
export function createDrizzle(pool: Pool): Database {
  return drizzle(pool, { schema });
}
