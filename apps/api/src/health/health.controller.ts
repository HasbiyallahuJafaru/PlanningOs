import { Controller, Get, Inject } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE_PRIVILEGED, type Database } from '../db/drizzle.provider';

/**
 * Health and diagnostics endpoints.
 *
 * - `GET /health`     — liveness: returns 200 if the process is up.
 * - `GET /health/db`  — readiness: runs `SELECT 1` to prove Drizzle can reach
 *                       Postgres. Throws (→ 500) if the database is unreachable.
 * - `GET /health/debug-sentry` — throws a plain Error so we can confirm Sentry
 *                       capture is wired. Plain Errors are reported by Sentry;
 *                       HttpExceptions are not. Scaffold-only; remove later.
 */
@Controller('health')
export class HealthController {
  constructor(@Inject(DRIZZLE_PRIVILEGED) private readonly db: Database) {}

  /** Liveness probe — the service is running. */
  @Get()
  check(): { status: string; service: string; timestamp: string } {
    return {
      status: 'ok',
      service: 'api',
      timestamp: new Date().toISOString(),
    };
  }

  /** Readiness probe — confirms the database is reachable via Drizzle. */
  @Get('db')
  async checkDb(): Promise<{
    status: string;
    database: string;
    timestamp: string;
  }> {
    await this.db.execute(sql`select 1`);
    return {
      status: 'ok',
      database: 'reachable',
      timestamp: new Date().toISOString(),
    };
  }

  /** Deliberately throws to verify Sentry error capture. Scaffold-only. */
  @Get('debug-sentry')
  triggerError(): never {
    throw new Error('Sentry test error from GET /health/debug-sentry');
  }
}
