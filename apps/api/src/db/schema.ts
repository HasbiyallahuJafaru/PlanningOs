/**
 * Drizzle schema.
 *
 * Intentionally empty for Batch 1.1 (repo + infra scaffold). The scope fence in
 * 04_PHASE_PLAN.md forbids real tables this batch ("any table beyond a
 * placeholder"). Real tables — tenants, users, projects, documents,
 * extracted_fields, audit_events (see 03_DATA_MODEL.md) — are added starting in
 * Batch 1.2 (auth + tenancy). Every table will carry tenant_id, created_at,
 * updated_at per the data model rules.
 *
 * This module exists so the Drizzle instance can be typed against a schema, and
 * so `drizzle-kit` has a schema file to point at, even before any table exists.
 */
export {};
