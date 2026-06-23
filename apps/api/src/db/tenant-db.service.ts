import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import {
  DRIZZLE_APP,
  type Database,
  type Transaction,
} from './drizzle.provider';

/**
 * Runs tenant-scoped database work under Row-Level Security.
 *
 * Every call opens a transaction on the RLS-enforced (non-superuser) connection
 * and sets `app.current_tenant` as a TRANSACTION-LOCAL setting (the `true` arg
 * to set_config), so it cannot leak onto other pooled connections. RLS policies
 * then restrict all reads/writes to the given tenant. The tenant id is passed as
 * a bound parameter, so it is not an injection vector.
 *
 * Business modules (from Batch 1.3 onward) use this for all data access; the
 * tenant id comes from the authenticated request's JWT claim.
 */
@Injectable()
export class TenantDb {
  constructor(@Inject(DRIZZLE_APP) private readonly db: Database) {}

  /**
   * Execute `fn` within a transaction scoped to `tenantId`.
   *
   * @param tenantId - the tenant UUID from the authenticated context.
   * @param fn - callback receiving the tenant-scoped transaction handle.
   * @returns whatever `fn` resolves to.
   */
  run<T>(tenantId: string, fn: (tx: Transaction) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => {
      await tx.execute(
        sql`select set_config('app.current_tenant', ${tenantId}, true)`,
      );
      return fn(tx);
    });
  }
}
