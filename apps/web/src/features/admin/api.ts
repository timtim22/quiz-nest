import type {
  AdminStatsDto,
  AdminUserDto,
  AdminUsersQuery,
  AuditLogEntryDto,
  Paginated,
  SystemSettingsDto,
  UpdateSettingsInput,
} from '@quiz-nest/shared';
import { apiClient } from '@/lib/api-client';

export const getStats = () => apiClient.get<AdminStatsDto>('/admin/stats');

export const listUsers = (query: Partial<AdminUsersQuery>) =>
  apiClient.get<Paginated<AdminUserDto>>('/admin/users', { query });

export type UserAction = 'approve' | 'disable' | 'enable';

export const changeUser = (id: string, action: UserAction) =>
  apiClient.post<AdminUserDto>(`/admin/users/${id}/${action}`);

export const removeUser = (id: string) => apiClient.delete<null>(`/admin/users/${id}`);

export const getSettings = () => apiClient.get<SystemSettingsDto>('/admin/settings');

export const updateSettings = (input: UpdateSettingsInput) =>
  apiClient.patch<SystemSettingsDto>('/admin/settings', input);

export const listAuditLogs = (page: number) =>
  apiClient.get<Paginated<AuditLogEntryDto>>('/admin/audit-logs', { query: { page } });
