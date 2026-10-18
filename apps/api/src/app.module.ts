import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { validateEnv } from './config/env.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { CurriculumModule } from './curriculum/curriculum.module.js';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnv }),
    PrismaModule,
    // Rate limits apply only where a controller uses ThrottlerGuard (e.g. login).
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 60 }],
      errorMessage: 'Too many attempts. Please wait a minute and try again.',
    }),
    // Feature modules go here, one per folder in src/modules.
    AuthModule,
    HealthModule,
    CurriculumModule,
  ],
  providers: [
    // Every error becomes { success: false, error: { code, message } }.
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    // Every successful response becomes { success: true, data }.
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
