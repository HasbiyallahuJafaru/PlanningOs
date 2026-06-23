import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './db/database.module';
import { HealthController } from './health/health.controller';

/**
 * Root application module.
 *
 * - SentryModule.forRoot() registers Sentry's NestJS integration.
 * - SentryGlobalFilter is registered as the FIRST APP_FILTER so it captures
 *   unhandled errors before any other exception filter processes them, as
 *   required by the @sentry/nestjs v10 docs. (Note: HttpExceptions are treated
 *   as control flow and are not reported by default.)
 * - DatabaseModule is global and exposes the Drizzle instances to the app.
 * - ConfigModule loads .env globally; AuthModule provides auth + tenancy.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SentryModule.forRoot(),
    DatabaseModule,
    AuthModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule {}
