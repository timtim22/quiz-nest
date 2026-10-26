import { HttpStatus, Injectable } from '@nestjs/common';
import {
  AuditAction,
  type AdminStatsDto,
  type AdminUserDto,
  type AdminUsersQuery,
  ErrorCode,
  type Paginated,
  type SystemSettingsDto,
  type UpdateSettingsInput,
  UserRole,
  UserStatus,
} from '@quiz-nest/shared';
import { AppException } from '../../common/errors/app.exception.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { SettingsService } from '../settings/settings.service.js';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  organization: { select: { name: true } },
} satisfies Prisma.UserSelect;

type UserRecord = Prisma.UserGetPayload<{ select: typeof USER_SELECT }>;

/** What admins can do to accounts. Every change is written to the audit log. */
@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly settings: SettingsService,
  ) {}

  async stats(): Promise<AdminStatsDto> {
    const [teachersByStatus, admins, organizations, subjects] = await Promise.all([
      this.prisma.user.groupBy({
        by: ['status'],
        where: { role: UserRole.TEACHER },
        _count: { _all: true },
      }),
      this.prisma.user.count({ where: { role: UserRole.ADMIN } }),
      this.prisma.organization.count(),
      this.prisma.subject.count(),
    ]);
    const teachers = (status: UserStatus) =>
      teachersByStatus.find((row) => row.status === status)?._count._all ?? 0;

    return {
      teachers: {
        active: teachers(UserStatus.ACTIVE),
        pending: teachers(UserStatus.PENDING),
        disabled: teachers(UserStatus.DISABLED),
      },
      admins,
      organizations,
      subjects,
    };
  }

  /** Newest first, optionally filtered by status and a name/email search. */
  async listUsers(query: AdminUsersQuery): Promise<Paginated<AdminUserDto>> {
    const where: Prisma.UserWhereInput = {
      status: query.status,
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: USER_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items: users.map(toAdminUser), page: query.page, pageSize: query.pageSize, total };
  }

  async approve(actorId: string, id: string): Promise<AdminUserDto> {
    const user = await this.findUser(id);
    if (user.status !== UserStatus.PENDING) {
      throw conflict('Only accounts waiting for approval can be approved.');
    }
    return this.setStatus(actorId, user, UserStatus.ACTIVE, AuditAction.USER_APPROVED);
  }

  /** The user is logged out everywhere and can't log in again until enabled. */
  async disable(actorId: string, id: string): Promise<AdminUserDto> {
    assertNotSelf(actorId, id, 'disable');
    const user = await this.findUser(id);
    if (user.status === UserStatus.DISABLED) return toAdminUser(user);

    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { status: UserStatus.DISABLED },
        select: USER_SELECT,
      }),
      this.prisma.session.deleteMany({ where: { userId: id } }),
    ]);
    await this.audit.record({
      actorId,
      action: AuditAction.USER_DISABLED,
      entityType: 'User',
      entityId: id,
      metadata: { email: user.email },
    });
    return toAdminUser(updated);
  }

  async enable(actorId: string, id: string): Promise<AdminUserDto> {
    const user = await this.findUser(id);
    if (user.status !== UserStatus.DISABLED) {
      throw conflict('Only disabled accounts can be enabled.');
    }
    return this.setStatus(actorId, user, UserStatus.ACTIVE, AuditAction.USER_ENABLED);
  }

  /** Deletes the account. Their school and its subjects stay, for any other teachers there. */
  async remove(actorId: string, id: string): Promise<void> {
    assertNotSelf(actorId, id, 'remove');
    const user = await this.findUser(id);
    await this.prisma.user.delete({ where: { id } });
    await this.audit.record({
      actorId,
      action: AuditAction.USER_REMOVED,
      entityType: 'User',
      entityId: id,
      metadata: { name: user.name, email: user.email },
    });
  }

  getSettings(): Promise<SystemSettingsDto> {
    return this.settings.get();
  }

  async updateSettings(actorId: string, input: UpdateSettingsInput): Promise<SystemSettingsDto> {
    const before = await this.settings.get();
    const after = await this.settings.update(input);
    await this.audit.record({
      actorId,
      action: AuditAction.SETTINGS_UPDATED,
      entityType: 'SystemSetting',
      metadata: { before, after },
    });
    return after;
  }

  private async findUser(id: string): Promise<UserRecord> {
    const user = await this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
    if (!user) throw new AppException(ErrorCode.NOT_FOUND, 'User not found.', HttpStatus.NOT_FOUND);
    return user;
  }

  private async setStatus(
    actorId: string,
    user: UserRecord,
    status: UserStatus,
    action: AuditAction,
  ): Promise<AdminUserDto> {
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { status },
      select: USER_SELECT,
    });
    await this.audit.record({
      actorId,
      action,
      entityType: 'User',
      entityId: user.id,
      metadata: { email: user.email },
    });
    return toAdminUser(updated);
  }
}

function toAdminUser(user: UserRecord): AdminUserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    organizationName: user.organization.name,
    createdAt: user.createdAt.toISOString(),
  };
}

/** Stops an admin from locking themselves out. */
function assertNotSelf(actorId: string, id: string, verb: string) {
  if (actorId === id) {
    throw new AppException(
      ErrorCode.BAD_REQUEST,
      `You can't ${verb} your own account.`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

function conflict(message: string) {
  return new AppException(ErrorCode.CONFLICT, message, HttpStatus.CONFLICT);
}
