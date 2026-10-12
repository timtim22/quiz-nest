import { createParamDecorator, type ExecutionContext, SetMetadata } from '@nestjs/common';
import type { AuthenticatedRequest, RequestUser } from './auth.types.js';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Every route needs a logged-in user unless it's marked @Public().
 * Use it only for routes anyone may call: login, health checks, student exam entry.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** The logged-in user: `me(@CurrentUser() user: RequestUser)`. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestUser =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
