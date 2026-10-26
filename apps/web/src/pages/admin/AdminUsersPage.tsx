import { type AdminUserDto, UserStatus } from '@quiz-nest/shared';
import { Search } from 'lucide-react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { inputClasses } from '@/components/ui/input-styles';
import { Pagination } from '@/components/ui/Pagination';
import { useChangeUser, useAdminUsers, useRemoveUser } from '@/features/admin/hooks';
import { STATUS_LABELS } from '@/features/admin/labels';
import { useAuth } from '@/features/auth/auth-context';
import { cn } from '@/lib/cn';

const FILTERS: { label: string; status?: UserStatus }[] = [
  { label: 'All' },
  { label: 'Waiting for approval', status: UserStatus.PENDING },
  { label: 'Active', status: UserStatus.ACTIVE },
  { label: 'Disabled', status: UserStatus.DISABLED },
];

const STATUS_TONES = { ACTIVE: 'green', PENDING: 'gold', DISABLED: 'red' } as const;

export function AdminUsersPage() {
  // Filters live in the URL, so they survive a reload and can be shared.
  const [params, setParams] = useSearchParams();
  const status = (params.get('status') as UserStatus | null) ?? undefined;
  const search = params.get('search') ?? '';
  const page = Number(params.get('page') ?? '1') || 1;

  const { data, error, isPending } = useAdminUsers({ status, search: search || undefined, page });
  const changeUser = useChangeUser();
  const removeUser = useRemoveUser();
  const actionError = changeUser.error ?? removeUser.error;

  function update(next: Record<string, string | undefined>) {
    const merged = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (value) merged.set(key, value);
      else merged.delete(key);
    }
    setParams(merged);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get('search');
    update({ search: String(value ?? '').trim() || undefined, page: undefined });
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
        <p className="mt-1 text-sm text-slate-600">Approve, disable or remove teacher accounts.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by status">
          {FILTERS.map((filter) => (
            <button
              key={filter.label}
              type="button"
              aria-pressed={status === filter.status}
              onClick={() => update({ status: filter.status, page: undefined })}
              className={cn(
                'h-9 rounded-lg px-3 text-sm font-medium',
                status === filter.status
                  ? 'bg-brand-800 text-white'
                  : 'text-slate-700 hover:bg-slate-100',
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} className="flex w-full gap-2 sm:w-auto" role="search">
          <input
            key={search}
            name="search"
            type="search"
            defaultValue={search}
            aria-label="Search by name or email"
            placeholder="Search name or email"
            className={inputClasses(false, 'h-9 min-w-0 flex-1 text-sm sm:w-64')}
          />
          <Button type="submit" variant="secondary" size="sm" aria-label="Search">
            <Search className="size-4" aria-hidden />
          </Button>
        </form>
      </div>

      {error && <Alert variant="error">{error.message}</Alert>}
      {actionError && <Alert variant="error">{actionError.message}</Alert>}

      <Card className="p-0">
        {isPending && <p className="p-5 text-sm text-slate-500">Loading users…</p>}
        {data?.items.length === 0 && <p className="p-5 text-sm text-slate-500">No users found.</p>}
        <ul className="divide-y divide-slate-100">
          {data?.items.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              busy={changeUser.isPending || removeUser.isPending}
              onAction={(action) => changeUser.mutate({ id: user.id, action })}
              onRemove={() => removeUser.mutate(user.id)}
            />
          ))}
        </ul>
      </Card>

      {data && (
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          onPageChange={(next) => update({ page: String(next) })}
        />
      )}
    </div>
  );
}

interface UserRowProps {
  user: AdminUserDto;
  busy: boolean;
  onAction: (action: 'approve' | 'disable' | 'enable') => void;
  onRemove: () => void;
}

function UserRow({ user, busy, onAction, onRemove }: UserRowProps) {
  const { user: me } = useAuth();
  const isMe = me?.id === user.id;

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
      <div className="min-w-0 flex-1 basis-56">
        <p className="truncate font-medium text-slate-900" dir="auto">
          {user.name}
          {user.role === 'ADMIN' && <span className="ms-2 text-xs text-gold-700">Admin</span>}
        </p>
        <p className="truncate text-sm text-slate-600">{user.email}</p>
        <p className="truncate text-xs text-slate-500" dir="auto">
          {user.organizationName} · joined {new Date(user.createdAt).toLocaleDateString()}
        </p>
      </div>

      <Badge tone={STATUS_TONES[user.status]}>{STATUS_LABELS[user.status]}</Badge>

      <div className="flex gap-2">
        {isMe ? (
          <span className="text-sm text-slate-500">You</span>
        ) : (
          <>
            {user.status === 'PENDING' && (
              <Button size="sm" disabled={busy} onClick={() => onAction('approve')}>
                Approve
              </Button>
            )}
            {user.status === 'ACTIVE' && (
              <Button
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  if (window.confirm(`Disable ${user.name}? They will be logged out.`)) {
                    onAction('disable');
                  }
                }}
              >
                Disable
              </Button>
            )}
            {user.status === 'DISABLED' && (
              <Button
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() => onAction('enable')}
              >
                Enable
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-red-700 hover:bg-red-50"
              disabled={busy}
              onClick={() => {
                if (window.confirm(`Remove ${user.name}'s account? This can't be undone.`)) {
                  onRemove();
                }
              }}
            >
              Remove
            </Button>
          </>
        )}
      </div>
    </li>
  );
}
