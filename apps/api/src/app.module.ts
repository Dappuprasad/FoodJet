import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { appConfig, authConfig, ordersConfig } from './config/configuration';
import { validateEnv } from './config/env.validation';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { MenuModule } from './modules/menu/menu.module';
import { OrderEventsModule } from './modules/orders/order-events.module';
import { OrdersModule } from './modules/orders/orders.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // Fails fast at boot on a missing or weak secret rather than at the first
      // request that needs it.
      validate: validateEnv,
      load: [appConfig, authConfig, ordersConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: Number(process.env.THROTTLE_LIMIT ?? 120) },
    ]),
    PrismaModule,
    OrderEventsModule,
    HealthModule,
    UsersModule,
    AuthModule,
    MenuModule,
    OrdersModule,
    RealtimeModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    // Authentication is global and opted out of per route with @Public(), so a
    // new endpoint is protected unless somebody deliberately opens it.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
