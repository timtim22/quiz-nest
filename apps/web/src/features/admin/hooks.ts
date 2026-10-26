import type { AdminUsersQuery } from '@quiz-nest/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';

export const adminKeys = {
  all: ['admin'] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
  users: (query: Partial<AdminUsersQuery>) => [...adminKeys.all, 'users', query] as const,
  settings: () => [...adminKeys.all, 'settings'] as const,
  auditLogs: (page: number) => [...adminKeys.all, 'audit-logs', page] as const,
};

export const useAdminStats = () => useQuery({ queryKey: adminKeys.stats(), queryFn: api.getStats });

export const useAdminUsers = (query: Partial<AdminUsersQuery>) =>
  useQuery({
    queryKey: adminKeys.users(query),
    queryFn: () => api.listUsers(query),
    // Keep showing the current page while the next one loads.
    placeholderData: keepPreviousData,
  });

export const useSettings = () =>
  useQuery({ queryKey: adminKeys.settings(), queryFn: api.getSettings });

export const useAuditLogs = (page: number) =>
  useQuery({
    queryKey: adminKeys.auditLogs(page),
    queryFn: () => api.listAuditLogs(page),
    placeholderData: keepPreviousData,
  });

/** Any admin change refreshes every admin screen (stats, lists, audit log). */
function useAdminMutation<TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  });
}

export const useChangeUser = () =>
  useAdminMutation((v: { id: string; action: api.UserAction }) => api.changeUser(v.id, v.action));

export const useRemoveUser = () => useAdminMutation(api.removeUser);

export const useUpdateSettings = () => useAdminMutation(api.updateSettings);
