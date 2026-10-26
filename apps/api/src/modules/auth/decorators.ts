import { createParamDecorator, type ExecutionContext, SetMetadata } from '@nestjs/common';
import type { UserRole } from '@quiz-nest/shared';
import type { AuthenticatedRequest, RequestUser } from './auth.types.js';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Every route needs a logged-in user unless it's marked @Public().
 * Use it only for routes anyone may call: login, health checks, student exam entry.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';

/**
 * Only these roles may use the route (or every route in the controller):
 *
 *   @Roles(UserRole.ADMIN)
 *   @Controller('admin')
 *
 * Routes without @Roles() are open to any logged-in user.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/** The logged-in user: `me(@CurrentUser() user: RequestUser)`. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestUser =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
