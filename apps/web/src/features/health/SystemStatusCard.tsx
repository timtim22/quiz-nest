import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { useHealth } from './useHealth';

type State = 'up' | 'down' | 'unknown';

/** Shows whether the API and database are reachable. Handy while developing. */
export function SystemStatusCard() {
  const { data, error, isPending, isFetching, refetch } = useHealth();

  // The API answers 503 with details.database = 'down' when only the database is the problem.
  const databaseDown =
    error instanceof ApiError &&
    (error.details as { database?: string } | undefined)?.database === 'down';

  const api: State = isPending ? 'unknown' : data || databaseDown ? 'up' : 'down';
  const database: State = isPending ? 'unknown' : data ? 'up' : databaseDown ? 'down' : 'unknown';

  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-slate-900">System status</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void refetch()}
          disabled={isFetching}
          aria-label="Check again"
        >
          <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} aria-hidden />
          <span className="hidden sm:inline">Check again</span>
        </Button>
      </div>

      <dl className="mt-4 divide-y divide-slate-100 text-sm">
        <StatusRow label="API" state={api} up="Online" down="Not reachable" />
        <StatusRow label="Database" state={database} up="Connected" down="Not reachable" />
      </dl>

      {error && !databaseDown && <p className="mt-3 text-sm text-red-600">{error.message}</p>}
      {data && (
        <p className="mt-3 text-xs text-slate-500">
          Last checked {new Date(data.timestamp).toLocaleTimeString()}
        </p>
      )}
    </Card>
  );
}

function StatusRow({
  label,
  state,
  up,
  down,
}: {
  label: string;
  state: State;
  up: string;
  down: string;
}) {
  const text = state === 'up' ? up : state === 'down' ? down : 'Checking…';

  return (
    <div className="flex items-center justify-between py-2.5">
      <dt className="text-slate-600">{label}</dt>
      <dd className="flex items-center gap-2 font-medium text-slate-900">
        <span
          aria-hidden
          className={cn(
            'size-2 rounded-full',
            state === 'up' && 'bg-brand-500',
            state === 'down' && 'bg-red-500',
            state === 'unknown' && 'bg-slate-300',
          )}
        />
        {text}
      </dd>
    </div>
  );
}
