import type { UserRole } from '@quiz-nest/shared';
import type { Request } from 'express';

/** What's inside a login (access) token. */
export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  /** Organization id. */
  org: string;
}

/** The logged-in user, attached to the request by AuthGuard. Read it with @CurrentUser(). */
export interface RequestUser {
  id: string;
  role: UserRole;
  organizationId: string;
}

export interface AuthenticatedRequest extends Request {
  user: RequestUser;
}
