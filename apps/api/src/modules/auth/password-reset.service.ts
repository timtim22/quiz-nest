import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditAction, ErrorCode } from '@quiz-nest/shared';
import { AppException } from '../../common/errors/app.exception.js';
import type { Env } from '../../config/env.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { MailService } from '../mail/mail.service.js';
import { PASSWORD_RESET_TTL_MS } from './auth.constants.js';
import { createRandomToken, hashPassword, hashToken } from './crypto.js';

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService<Env, true>,
    private readonly audit: AuditService,
  ) {}

  /**
   * Emails a reset link if the account exists. The caller always gets the same
   * response, so this can't be used to find out which emails have accounts.
   */
  async requestReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, status: true },
    });
    if (!user || user.status === 'DISABLED') return;

    const token = createRandomToken();
    await this.prisma.$transaction([
      // Only the newest link works.
      this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
      this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
        },
      }),
    ]);

    const link = new URL('/reset-password', this.config.get('WEB_URL', { infer: true }));
    link.searchParams.set('token', token);
    await this.mail.sendPasswordReset({ to: user.email, name: user.name, link: link.toString() });
  }

  /** Sets the new password, uses up the link, and logs the user out everywhere. */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
      throw invalidLink();
    }

    const passwordHash = await hashPassword(newPassword);

    await this.prisma.$transaction(async (tx) => {
      // Only one request can use the link, even if two arrive at the same moment.
      const { count } = await tx.passwordResetToken.updateMany({
        where: { id: record.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (count === 0) throw invalidLink();

      await tx.user.update({ where: { id: record.userId }, data: { passwordHash } });
      await tx.session.deleteMany({ where: { userId: record.userId } });
    });

    await this.audit.record({
      actorId: record.userId,
      action: AuditAction.PASSWORD_RESET,
      entityType: 'User',
      entityId: record.userId,
    });
  }
}

function invalidLink() {
  return new AppException(
    ErrorCode.INVALID_RESET_TOKEN,
    'This reset link has expired or was already used. Please request a new one.',
    HttpStatus.BAD_REQUEST,
  );
}
