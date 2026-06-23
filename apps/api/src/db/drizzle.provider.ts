import { Pool } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

/**
 * Two database connections back the hybrid tenant-isolation model:
 *
 * - PRIVILEGED — connects as the owner/superuser (DATABASE_URL). Bypasses RLS.
 *   Used ONLY for auth bootstrap (register/login/refresh) and migrations, where
 *   work must happen before or across a tenant context.
 * - APP — connects as the non-superuser `planningos_app` role (APP_DATABASE_URL).
 *   RLS policies apply. Used for every tenant-scoped query, always inside a
 *   transaction that sets `app.current_tenant` (see TenantDb.run).
 */
export const DRIZZLE_PRIVILEGED = Symbol('DRIZZLE_PRIVILEGED');
export const DRIZZLE_APP = Symbol('DRIZZLE_APP');
export const PG_POOL_PRIVILEGED = Symbol('PG_POOL_PRIVILEGED');
export const PG_POOL_APP = Symbol('PG_POOL_APP');

/** The Drizzle database type, bound to the project schema. */
export type Database = NodePgDatabase<typeof schema>;

/** A transaction handle with the same schema binding (what TenantDb.run yields). */
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

/**
 * Creates a pg Pool from a connection string, throwing if it is absent rather
 * than silently connecting to a default — we never want to point at an
 * unintended database. See .env.example and 07_DEPLOYMENT.md (EU/UK region).
 *
 * @param connectionString - the postgres:// URL.
 * @param label - env var name, used only for a clearer error message.
 */
export function createPool(
  connectionString: string | undefined,
  label: string,
): Pool {
  if (!connectionString) {
    throw new Error(`${label} is not set. See apps/api/.env.example.`);
  }
  return new Pool({ connectionString });
}

/**
 * Wraps a pg Pool in a Drizzle instance bound to the project schema.
 * @param pool - an active pg connection Pool.
 */
export function createDrizzle(pool: Pool): Database {
  return drizzle(pool, { schema });
}
