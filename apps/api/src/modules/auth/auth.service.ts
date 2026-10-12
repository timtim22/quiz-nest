import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  type AuthSession,
  type AuthUser,
  ErrorCode,
  type LoginInput,
  type RegisterInput,
  UserRole,
} from '@quiz-nest/shared';
import { AppException } from '../../common/errors/app.exception.js';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AccessTokenPayload } from './auth.types.js';
import { hashPassword, verifyPassword } from './crypto.js';
import { SessionsService } from './sessions.service.js';

/** The fields needed to build an AuthUser. Never includes the password hash. */
const AUTH_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  organizationId: true,
  organization: { select: { name: true } },
} satisfies Prisma.UserSelect;

type AuthUserRecord = Prisma.UserGetPayload<{ select: typeof AUTH_USER_SELECT }>;

/** A session for the response body, plus the refresh token the controller puts in a cookie. */
export interface IssuedSession {
  session: AuthSession;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly sessions: SessionsService,
  ) {}

  /** Creates a teacher account and a new organization for their school, then logs them in. */
  async register(input: RegisterInput): Promise<IssuedSession> {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });
    if (existing) throw emailTaken();

    const passwordHash = await hashPassword(input.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          // Never taken from the request: everyone who signs up is a teacher.
          role: UserRole.TEACHER,
          organization: {
            create: { name: input.schoolName, slug: organizationSlug(input.schoolName) },
          },
        },
        select: AUTH_USER_SELECT,
      });
      return this.issueSession(user);
    } catch (error) {
      // Two sign-ups with the same email at the same moment.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw emailTaken();
      }
      throw error;
    }
  }

  async login(input: LoginInput): Promise<IssuedSession> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { ...AUTH_USER_SELECT, passwordHash: true },
    });

    // Same error and same timing whether the email or the password is wrong.
    const passwordMatches = await verifyPassword(input.password, user?.passwordHash);
    if (!user || !passwordMatches) {
      throw new AppException(
        ErrorCode.INVALID_CREDENTIALS,
        'Wrong email or password.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (user.status === 'DISABLED') throw accountDisabled();

    return this.issueSession(user);
  }

  /** Swaps the refresh cookie for a new one and a new access token. */
  async refresh(refreshToken: string): Promise<IssuedSession> {
    const rotated = await this.sessions.rotate(refreshToken);
    const user = await this.prisma.user.findUnique({
      where: { id: rotated.userId },
      select: AUTH_USER_SELECT,
    });
    if (!user || user.status === 'DISABLED') {
      await this.sessions.endAll(rotated.userId);
      throw accountDisabled();
    }

    return { session: await this.buildSession(user), refreshToken: rotated.token };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (refreshToken) await this.sessions.end(refreshToken);
  }

  async me(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: AUTH_USER_SELECT,
    });
    if (!user || user.status === 'DISABLED') throw accountDisabled();
    return toAuthUser(user);
  }

  private async issueSession(user: AuthUserRecord): Promise<IssuedSession> {
    const refreshToken = await this.sessions.create(user.id);
    return { session: await this.buildSession(user), refreshToken };
  }

  private async buildSession(user: AuthUserRecord): Promise<AuthSession> {
    const payload: AccessTokenPayload = {
      sub: user.id,
      role: user.role,
      org: user.organizationId,
    };
    return { accessToken: await this.jwt.signAsync(payload), user: toAuthUser(user) };
  }
}

function toAuthUser(user: AuthUserRecord): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    organizationName: user.organization.name,
  };
}

/** "City School, Lahore" -> "city-school-lahore-k3x9q2". The random end keeps it unique. */
function organizationSlug(name: string): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50) || 'school';
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}

function emailTaken() {
  return new AppException(
    ErrorCode.EMAIL_ALREADY_REGISTERED,
    'An account with this email already exists. Try logging in instead.',
    HttpStatus.CONFLICT,
  );
}

function accountDisabled() {
  return new AppException(
    ErrorCode.ACCOUNT_DISABLED,
    'This account has been disabled. Please contact your school admin.',
    HttpStatus.FORBIDDEN,
  );
}
