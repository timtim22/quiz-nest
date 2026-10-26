import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import {
  type AdminStatsDto,
  type AdminUserDto,
  type AdminUsersQuery,
  adminUsersQuerySchema,
  type AuditLogEntryDto,
  type Paginated,
  type PaginationQuery,
  paginationQuerySchema,
  type SystemSettingsDto,
  type UpdateSettingsInput,
  updateSettingsSchema,
  UserRole,
} from '@quiz-nest/shared';
import { ParseIdPipe } from '../../common/pipes/parse-id.pipe.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { AuditService } from '../audit/audit.service.js';
import type { RequestUser } from '../auth/auth.types.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { AdminService } from './admin.service.js';

/** Everything under /api/admin is for admins only; teachers get 403. */
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly audit: AuditService,
  ) {}

  @Get('stats')
  stats(): Promise<AdminStatsDto> {
    return this.admin.stats();
  }

  @Get('users')
  users(
    @Query(new ZodValidationPipe(adminUsersQuerySchema)) query: AdminUsersQuery,
  ): Promise<Paginated<AdminUserDto>> {
    return this.admin.listUsers(query);
  }

  @Post('users/:id/approve')
  @HttpCode(200)
  approve(@CurrentUser() user: RequestUser, @Param('id', ParseIdPipe) id: string) {
    return this.admin.approve(user.id, id);
  }

  @Post('users/:id/disable')
  @HttpCode(200)
  disable(@CurrentUser() user: RequestUser, @Param('id', ParseIdPipe) id: string) {
    return this.admin.disable(user.id, id);
  }

  @Post('users/:id/enable')
  @HttpCode(200)
  enable(@CurrentUser() user: RequestUser, @Param('id', ParseIdPipe) id: string) {
    return this.admin.enable(user.id, id);
  }

  @Delete('users/:id')
  async remove(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseIdPipe) id: string,
  ): Promise<null> {
    await this.admin.remove(user.id, id);
    return null;
  }

  @Get('settings')
  settings(): Promise<SystemSettingsDto> {
    return this.admin.getSettings();
  }

  @Patch('settings')
  updateSettings(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(updateSettingsSchema)) body: UpdateSettingsInput,
  ): Promise<SystemSettingsDto> {
    return this.admin.updateSettings(user.id, body);
  }

  @Get('audit-logs')
  auditLogs(
    @Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQuery,
  ): Promise<Paginated<AuditLogEntryDto>> {
    return this.audit.list(query);
  }
}
