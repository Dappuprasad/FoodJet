import 'reflect-metadata';
import { Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { buildValidationPipe } from './common/validation';
import type { AppConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = new Logger('Bootstrap');

  const config = app.get(ConfigService);
  const app_ = config.getOrThrow<AppConfig>('app');

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());
  app.use(cookieParser());

  app.enableCors({
    origin: app_.corsOrigins,
    // Required for the httpOnly refresh cookie to travel cross-origin.
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(buildValidationPipe());
  app.enableShutdownHooks();

  if (app_.swaggerEnabled) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('FoodJet API')
        .setDescription(
          'REST and WebSocket API for the FoodJet food delivery app. ' +
            'All monetary values are integers in paise (100 paise = ₹1).',
        )
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('menu', 'Browse and manage dishes')
        .addTag('orders', 'Place and track orders')
        .addTag('auth', 'Accounts and sessions')
        .addTag('admin', 'Staff-only operations')
        .addTag('health', 'Service and dependency status')
        .build(),
    );

    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(app_.port, '0.0.0.0');

  logger.log(`API listening on http://localhost:${app_.port}/api/v1`);
  if (app_.swaggerEnabled) {
    logger.log(`Swagger UI at http://localhost:${app_.port}/api/docs`);
  }
  logger.log(`Accepting browser origins: ${app_.corsOrigins.join(', ')}`);
}

void bootstrap();
