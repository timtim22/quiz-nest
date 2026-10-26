import { Injectable } from '@nestjs/common';
import type { SystemSettingsDto, UpdateSettingsInput } from '@quiz-nest/shared';
import { PrismaService } from '../../prisma/prisma.service.js';

const SETTINGS_ROW = 1;

/** System-wide settings, stored in a single database row and changed by admins. */
@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<SystemSettingsDto> {
    const row = await this.prisma.systemSetting.findUnique({ where: { id: SETTINGS_ROW } });
    return { requireTeacherApproval: row?.requireTeacherApproval ?? false };
  }

  async update(input: UpdateSettingsInput): Promise<SystemSettingsDto> {
    const row = await this.prisma.systemSetting.upsert({
      where: { id: SETTINGS_ROW },
      create: { id: SETTINGS_ROW, ...input },
      update: input,
    });
    return { requireTeacherApproval: row.requireTeacherApproval };
  }
}
