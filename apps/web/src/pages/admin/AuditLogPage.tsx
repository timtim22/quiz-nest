import type { AuditLogEntryDto } from '@quiz-nest/shared';
import { useSearchParams } from 'react-router';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { useAuditLogs } from '@/features/admin/hooks';
import { AUDIT_ACTION_LABELS } from '@/features/admin/labels';

export function AuditLogPage() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') ?? '1') || 1;
  const { data, error, isPending } = useAuditLogs(page);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Audit log</h1>
        <p className="mt-1 text-sm text-slate-600">Important actions, newest first.</p>
      </div>

      {error && <Alert variant="error">{error.message}</Alert>}

      <Card className="p-0">
        {isPending && <p className="p-5 text-sm text-slate-500">Loading…</p>}
        {data?.items.length === 0 && <p className="p-5 text-sm text-slate-500">Nothing yet.</p>}
        <ol className="divide-y divide-slate-100">
          {data?.items.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 p-4">
              <time
                dateTime={entry.createdAt}
                className="w-40 shrink-0 text-xs text-slate-500 tabular-nums"
              >
                {new Date(entry.createdAt).toLocaleString()}
              </time>
              <p className="min-w-0 flex-1 text-sm text-slate-800">
                <span className="font-medium">{actorName(entry)}</span>{' '}
                {(AUDIT_ACTION_LABELS[entry.action] ?? entry.action).toLowerCase()}
                {detail(entry)}
              </p>
            </li>
          ))}
        </ol>
      </Card>

      {data && (
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          onPageChange={(next) => setParams({ page: String(next) })}
        />
      )}
    </div>
  );
}

function actorName(entry: AuditLogEntryDto): string {
  if (entry.actor) return entry.actor.name;
  return entry.metadata?.email ? 'A removed user' : 'System';
}

/** Extra context, e.g. which account was disabled. */
function detail(entry: AuditLogEntryDto): string {
  const email = entry.metadata?.email;
  if (typeof email === 'string' && entry.actor?.email !== email) return ` (${email})`;
  if (entry.action === 'SETTINGS_UPDATED') {
    const after = entry.metadata?.after as { requireTeacherApproval?: boolean } | undefined;
    if (after)
      return `: approval for new teachers turned ${after.requireTeacherApproval ? 'on' : 'off'}`;
  }
  return '';
}
