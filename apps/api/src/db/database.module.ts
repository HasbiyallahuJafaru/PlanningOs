import { Global, Inject, Module, type OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import {
  createDrizzle,
  createPool,
  DRIZZLE_APP,
  DRIZZLE_PRIVILEGED,
  PG_POOL_APP,
  PG_POOL_PRIVILEGED,
} from './drizzle.provider';
import { TenantDb } from './tenant-db.service';

/**
 * Global database module.
 *
 * Wires the two connections behind the hybrid tenant-isolation model
 * (see drizzle.provider.ts): a PRIVILEGED pool (RLS-bypassing, for auth
 * bootstrap) and an APP pool (RLS-enforced, for tenant-scoped queries via
 * TenantDb). Both pools are closed on shutdown (requires
 * app.enableShutdownHooks() in main.ts).
 */
@Global()
@Module({
  providers: [
    {
      provide: PG_POOL_PRIVILEGED,
      useFactory: () => createPool(process.env.DATABASE_URL, 'DATABASE_URL'),
    },
    {
      provide: PG_POOL_APP,
      useFactory: () =>
        createPool(process.env.APP_DATABASE_URL, 'APP_DATABASE_URL'),
    },
    {
      provide: DRIZZLE_PRIVILEGED,
      inject: [PG_POOL_PRIVILEGED],
      useFactory: (pool: Pool) => createDrizzle(pool),
    },
    {
      provide: DRIZZLE_APP,
      inject: [PG_POOL_APP],
      useFactory: (pool: Pool) => createDrizzle(pool),
    },
    TenantDb,
  ],
  exports: [DRIZZLE_PRIVILEGED, DRIZZLE_APP, TenantDb],
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(
    @Inject(PG_POOL_PRIVILEGED) private readonly privilegedPool: Pool,
    @Inject(PG_POOL_APP) private readonly appPool: Pool,
  ) {}

  /** Closes both connection pools when the app shuts down. */
  async onModuleDestroy(): Promise<void> {
    await Promise.allSettled([this.privilegedPool.end(), this.appPool.end()]);
  }
}
