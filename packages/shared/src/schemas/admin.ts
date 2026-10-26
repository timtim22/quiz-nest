import { z } from 'zod';
import { UserRole, UserStatus } from '../constants/roles.js';
import { paginationQuerySchema } from './pagination.js';

/** GET /api/admin/users?status=PENDING&search=ali&page=1 */
export const adminUsersQuerySchema = paginationQuerySchema.extend({
  status: z.enum([UserStatus.ACTIVE, UserStatus.PENDING, UserStatus.DISABLED]).optional(),
  search: z.string().trim().max(100).optional(),
});

export const updateSettingsSchema = z.object({
  requireTeacherApproval: z.boolean(),
});

export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

/** A row on the admin's user list. */
export interface AdminUserDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  organizationName: string;
  createdAt: string;
}

/** GET /api/admin/stats */
export interface AdminStatsDto {
  teachers: { active: number; pending: number; disabled: number };
  admins: number;
  organizations: number;
  subjects: number;
}

/** System-wide settings an admin can change. */
export interface SystemSettingsDto {
  /** New teachers must be approved by an admin before they can log in. */
  requireTeacherApproval: boolean;
}

/** One entry in the audit log. */
export interface AuditLogEntryDto {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  /** Who did it; null for system actions or deleted users. */
  actor: { id: string; name: string; email: string } | null;
  createdAt: string;
}
