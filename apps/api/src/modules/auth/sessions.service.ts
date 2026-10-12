import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCode } from '@quiz-nest/shared';
import { AppException } from '../../common/errors/app.exception.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { REFRESH_TOKEN_TTL_MS, ROTATION_GRACE_MS } from './auth.constants.js';
import { createRandomToken, hashToken } from './crypto.js';

/**
 * Refresh tokens: one per logged-in browser, kept in an httpOnly cookie.
 * The database only stores a hash of each token.
 */
@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Starts a session and returns its refresh token. */
  async create(userId: string): Promise<string> {
    const token = createRandomToken();
    const now = Date.now();

    await this.prisma.$transaction([
      // Tidy up this user's expired sessions while we're here.
      this.prisma.session.deleteMany({ where: { userId, expiresAt: { lt: new Date(now) } } }),
      this.prisma.session.create({
        data: {
          userId,
          tokenHash: hashToken(token),
          expiresAt: new Date(now + REFRESH_TOKEN_TTL_MS),
        },
      }),
    ]);

    return token;
  }

  /**
   * Swaps a refresh token for a new one ("rotation"), so a stolen token stops working
   * once the real user refreshes. If an old token is used again:
   * - within ROTATION_GRACE_MS, it's two tabs refreshing at once: allow it;
   * - later, someone may have stolen it: end every session for that user.
   */
  async rotate(token: string): Promise<{ userId: string; token: string }> {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    const now = Date.now();

    if (!session || session.expiresAt.getTime() <= now) throw sessionEnded();

    if (session.rotatedAt) {
      if (now - session.rotatedAt.getTime() > ROTATION_GRACE_MS) {
        await this.endAll(session.userId);
        throw sessionEnded();
      }
    } else {
      await this.prisma.session.updateMany({
        where: { id: session.id, rotatedAt: null },
        data: { rotatedAt: new Date(now) },
      });
    }

    return { userId: session.userId, token: await this.create(session.userId) };
  }

  /** Logout: deleting the row means the token can never be used again, not even in the grace period. */
  async end(token: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }

  /** Logs the user out on every device. */
  async endAll(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { userId } });
  }
}

function sessionEnded() {
  return new AppException(
    ErrorCode.UNAUTHORIZED,
    'Your session has ended. Please log in again.',
    HttpStatus.UNAUTHORIZED,
  );
}
