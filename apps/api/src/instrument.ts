import 'dotenv/config';
import * as Sentry from '@sentry/nestjs';

/**
 * Sentry initialization for the API service.
 *
 * This module is imported FIRST in `main.ts`, before NestFactory and any other
 * application module, so Sentry's auto-instrumentation can patch the runtime
 * before the app loads. This is the setup pattern required by @sentry/nestjs v10.
 *
 * Per 02_ARCHITECTURE.md, Sentry is wired in from the first commit on every
 * service. Locally, `SENTRY_DSN` is typically unset — in that case Sentry stays
 * inert and sends nothing, so no Sentry account is needed for local development.
 * The DSN is supplied via Render's secret manager in staging/production.
 */
Sentry.init({
  dsn: process.env.SENTRY_DSN || undefined,
  environment: process.env.SENTRY_ENVIRONMENT ?? 'development',
  // Capture 100% of transactions for now; tune down before production load.
  tracesSampleRate: 1.0,
});
