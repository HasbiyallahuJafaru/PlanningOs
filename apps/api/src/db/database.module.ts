import { Global, Inject, Module, type OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import {
  createDrizzle,
  createPool,
  DRIZZLE,
  PG_POOL,
} from './drizzle.provider';

/**
 * Global database module.
 *
 * Provides a single Postgres connection Pool and the Drizzle instance built on
 * top of it, both exported so any module can inject them via the DRIZZLE /
 * PG_POOL tokens. Marked @Global so feature modules do not need to re-import it.
 *
 * Closes the pool on application shutdown (requires app.enableShutdownHooks()
 * in main.ts) to avoid leaking connections.
 */
@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      useFactory: createPool,
    },
    {
      provide: DRIZZLE,
      inject: [PG_POOL],
      useFactory: (pool: Pool) => createDrizzle(pool),
    },
  ],
  exports: [DRIZZLE, PG_POOL],
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  /** Closes the Postgres connection pool when the app shuts down. */
  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
