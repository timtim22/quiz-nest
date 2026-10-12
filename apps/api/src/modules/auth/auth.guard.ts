import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ErrorCode } from '@quiz-nest/shared';
import type { Request } from 'express';
import { AppException } from '../../common/errors/app.exception.js';
import type { AccessTokenPayload, AuthenticatedRequest } from './auth.types.js';
import { IS_PUBLIC_KEY } from './decorators.js';

/**
 * Runs before every route (registered globally in AuthModule). It checks the
 * `Authorization: Bearer <token>` header and puts the user on `request.user`.
 * Routes marked @Public() skip it.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = bearerToken(request);
    if (!token) throw notLoggedIn();

    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
      request.user = { id: payload.sub, role: payload.role, organizationId: payload.org };
      return true;
    } catch {
      throw notLoggedIn();
    }
  }
}

function bearerToken(request: Request): string | undefined {
  const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
  return scheme === 'Bearer' && token ? token : undefined;
}

function notLoggedIn() {
  return new AppException(ErrorCode.UNAUTHORIZED, 'Please log in.', HttpStatus.UNAUTHORIZED);
}
