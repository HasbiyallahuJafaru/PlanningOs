-- setup-app-role.sql — provisions the non-superuser application role used for
-- RLS-enforced, tenant-scoped queries. Run AFTER migrations (grants need tables).
--
-- Roles/grants are environment-specific and are NOT managed by migrations. The
-- role password is passed at runtime as a psql variable so it never lives in
-- source control (07_DEPLOYMENT.md: no secrets in committed files):
--
--   psql "$DATABASE_URL" -v app_password="$APP_DB_PASSWORD" -f scripts/setup-app-role.sql
--
-- This role is deliberately NOSUPERUSER + NOBYPASSRLS so Row-Level Security
-- policies actually apply to it. The privileged migration/auth role (the owner)
-- bypasses RLS by design.

\set app_role planningos_app

SELECT format(
  'CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE',
  :'app_role', :'app_password'
)
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_role')
\gexec

-- Keep the password in sync if the role already exists (idempotent re-runs).
SELECT format('ALTER ROLE %I LOGIN PASSWORD %L', :'app_role', :'app_password')
\gexec

GRANT USAGE ON SCHEMA public TO planningos_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO planningos_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO planningos_app;

-- Ensure tables/sequences created by FUTURE migrations are also granted.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO planningos_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO planningos_app;
