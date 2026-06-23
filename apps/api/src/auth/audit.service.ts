import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_PRIVILEGED, type Database } from '../db/drizzle.provider';
import { authAudit } from '../db/schema';

/** Details recorded for an authentication event. */
export interface AuthEvent {
  eventType: string;
  tenantId?: string | null;
  actorUserId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  payload?: Record<string, unknown> | null;
}

/**
 * Writes auth events to `auth_audit`. Uses the privileged connection because
 * audit rows are written during auth flows that have no tenant context yet
 * (e.g. a failed login for an unknown tenant). Auditing must never break the
 * primary flow, so write failures are logged, not thrown.
 *
 * Per 05_COMPLIANCE.md the audit trail exists from the start; this is the
 * auth-specific audit. The general `audit_events` table arrives in Batch 1.3.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@Inject(DRIZZLE_PRIVILEGED) private readonly db: Database) {}

  /** Records a single auth event. Best-effort: never throws. */
  async record(event: AuthEvent): Promise<void> {
    try {
      await this.db.insert(authAudit).values({
        eventType: event.eventType,
        tenantId: event.tenantId ?? null,
        actorUserId: event.actorUserId ?? null,
        ip: event.ip ?? null,
        userAgent: event.userAgent ?? null,
        payload: event.payload ?? null,
      });
    } catch (err) {
      this.logger.error(
        `Failed to write auth_audit event "${event.eventType}": ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }
}
