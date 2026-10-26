import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ErrorCode, type UserRole } from '@quiz-nest/shared';
import type { Request } from 'express';
import { AppException } from '../../common/errors/app.exception.js';
import type { AccessTokenPayload, AuthenticatedRequest } from './auth.types.js';
import { IS_PUBLIC_KEY, ROLES_KEY } from './decorators.js';

/**
 * Runs before every route (registered globally in AuthModule). It checks the
 * `Authorization: Bearer <token>` header, puts the user on `request.user`, and
 * enforces @Roles(). Routes marked @Public() skip it.
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

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
    } catch {
      throw notLoggedIn();
    }
    request.user = { id: payload.sub, role: payload.role, organizationId: payload.org };

    const roles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (roles && !roles.includes(request.user.role)) {
      throw new AppException(
        ErrorCode.FORBIDDEN,
        "You don't have permission to do this.",
        HttpStatus.FORBIDDEN,
      );
    }
    return true;
  }
}

function bearerToken(request: Request): string | undefined {
  const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
  return scheme === 'Bearer' && token ? token : undefined;
}

function notLoggedIn() {
  return new AppException(ErrorCode.UNAUTHORIZED, 'Please log in.', HttpStatus.UNAUTHORIZED);
}
