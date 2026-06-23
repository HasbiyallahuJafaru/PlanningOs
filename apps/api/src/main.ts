// IMPORTANT: this import must come first so Sentry instruments the runtime
// before any other module is loaded. Do not reorder.
import './instrument';

import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * Boots the NestJS API.
 *
 * Listens on `API_PORT` (default 3001). Enables graceful shutdown hooks so the
 * Postgres pool is closed cleanly (see DatabaseModule.onModuleDestroy) when the
 * process receives a termination signal.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  // Validate and strip request DTOs globally; reject unknown properties.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Render (and most PaaS) inject PORT; locally we use API_PORT. Prefer PORT.
  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3001);
  await app.listen(port);

  Logger.log(`API listening on http://localhost:${port}`, 'Bootstrap');
}

void bootstrap();
