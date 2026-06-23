/**
 * Drizzle schema — Batch 1.2 (auth + tenancy).
 *
 * Multi-tenancy model (decision recorded in STATE.md / 02_ARCHITECTURE.md):
 * HYBRID isolation — Postgres Row-Level Security is the hard backstop, plus
 * app-level tenant context. Every tenant-scoped table:
 *   - carries `tenant_id` (the `tenants` table uses its own `id`),
 *   - has RLS enabled with a policy that only exposes rows where
 *     `tenant_id = current_setting('app.current_tenant')`.
 *
 * The second arg to current_setting is `true` (missing_ok): when the GUC is not
 * set the call returns NULL, the comparison is NULL, and NO rows are visible —
 * the system fails CLOSED. The request layer sets `app.current_tenant` per
 * transaction (see tenant-context helper). Auth bootstrap (register/login/
 * refresh) runs on a privileged pool that bypasses RLS, because those
 * operations must act before a tenant context exists.
 *
 * Policies target PUBLIC: the app connects as a NON-superuser role
 * (`planningos_app`) so policies apply; the privileged pool connects as a
 * superuser/owner and bypasses them by design. Role + GRANTs are provisioned
 * by scripts/setup-app-role.sql (env-specific), not by migrations.
 */
import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Tenant-isolation predicate reused by every tenant-scoped table's policy.
 * @param column - the SQL column that holds the tenant id for this table.
 */
const tenantMatches = (column: string) =>
  sql.raw(`${column} = current_setting('app.current_tenant', true)::uuid`);

/** Standard created/updated timestamps applied to every table. */
const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
};

/**
 * Application roles for Phase 1 (dev/consultant-facing). Council roles
 * (officer, enforcement_officer, manager) are intentionally NOT added until
 * Phase 3 — see 03_DATA_MODEL.md.
 */
export const userRole = pgEnum('user_role', ['admin', 'consultant', 'developer']);

/**
 * tenants — the isolation root. A row's own `id` is the tenant id, so its RLS
 * policy compares `id` (not `tenant_id`) to the current tenant setting.
 */
export const tenants = pgTable(
  'tenants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    ...timestamps,
  },
  () => [
    pgPolicy('tenants_isolation', {
      as: 'permissive',
      for: 'all',
      to: 'public',
      using: tenantMatches('id'),
      withCheck: tenantMatches('id'),
    }),
  ],
);

/**
 * users — belongs to exactly one tenant. Email is unique per tenant (the same
 * email may exist in different tenants). `password_hash` is an argon2id hash.
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: userRole('role').notNull().default('developer'),
    ...timestamps,
  },
  (t) => [
    unique('users_tenant_email_unique').on(t.tenantId, t.email),
    pgPolicy('users_isolation', {
      as: 'permissive',
      for: 'all',
      to: 'public',
      using: tenantMatches('tenant_id'),
      withCheck: tenantMatches('tenant_id'),
    }),
  ],
);

/**
 * refresh_tokens — rotating refresh tokens with reuse detection.
 *
 * Only the SHA-256 hash of the opaque token is stored (never the token). On
 * refresh, the presented token is rotated: the old row is revoked and a new one
 * issued with `replacedById` linking the chain. All tokens issued from one login
 * share a `familyId`; if a token that is already revoked is presented again,
 * that is a reuse/theft signal and the whole family is revoked.
 */
export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    familyId: uuid('family_id').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    replacedById: uuid('replaced_by_id'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('refresh_tokens_token_hash_idx').on(t.tokenHash),
    index('refresh_tokens_family_idx').on(t.familyId),
    pgPolicy('refresh_tokens_isolation', {
      as: 'permissive',
      for: 'all',
      to: 'public',
      using: tenantMatches('tenant_id'),
      withCheck: tenantMatches('tenant_id'),
    }),
  ],
);

/**
 * auth_audit — append-only record of authentication events (registration,
 * login success/failure, token refresh, reuse detection, logout). `tenantId`
 * and `actorUserId` are nullable because some events (e.g. a login attempt for
 * an unknown tenant) have no resolved tenant or actor. Per 05_COMPLIANCE.md the
 * audit trail must exist before real data does.
 */
export const authAudit = pgTable(
  'auth_audit',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id'),
    actorUserId: uuid('actor_user_id'),
    eventType: text('event_type').notNull(),
    ip: text('ip'),
    userAgent: text('user_agent'),
    payload: jsonb('payload'),
    occurredAt: timestamp('occurred_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('auth_audit_tenant_idx').on(t.tenantId),
    pgPolicy('auth_audit_isolation', {
      as: 'permissive',
      for: 'all',
      to: 'public',
      using: tenantMatches('tenant_id'),
      withCheck: tenantMatches('tenant_id'),
    }),
  ],
);
