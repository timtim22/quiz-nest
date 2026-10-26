import { Building2, Clock, UserCheck, UserX } from 'lucide-react';
import { Link } from 'react-router';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { useAdminStats, useSettings, useUpdateSettings } from '@/features/admin/hooks';

export function AdminDashboardPage() {
  const { data: stats, error } = useAdminStats();
  const value = (n: number | undefined) => n ?? '–';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Administration</h1>
        <p className="mt-1 text-sm text-slate-600">Teachers, schools and system settings.</p>
      </div>

      {error && <Alert variant="error">{error.message}</Alert>}

      <section aria-label="Statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active teachers" value={value(stats?.teachers.active)} icon={UserCheck} />
        <Link
          to="/admin/users?status=PENDING"
          className="rounded-xl hover:ring-2 hover:ring-gold-300"
        >
          <StatCard
            label="Waiting for approval"
            value={value(stats?.teachers.pending)}
            icon={Clock}
            hint="Open the list"
          />
        </Link>
        <StatCard label="Disabled teachers" value={value(stats?.teachers.disabled)} icon={UserX} />
        <StatCard label="Schools" value={value(stats?.organizations)} icon={Building2} />
      </section>

      <SettingsCard />
    </div>
  );
}

function SettingsCard() {
  const { data: settings } = useSettings();
  const update = useUpdateSettings();
  const checked = settings?.requireTeacherApproval ?? false;

  return (
    <Card className="max-w-2xl">
      <h2 className="text-base font-semibold text-slate-900">Settings</h2>
      <label className="mt-4 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          className="mt-0.5 size-5 shrink-0 accent-brand-700"
          checked={checked}
          disabled={!settings || update.isPending}
          onChange={(event) => update.mutate({ requireTeacherApproval: event.target.checked })}
        />
        <span>
          <span className="block text-sm font-medium text-slate-900">
            New teachers need approval
          </span>
          <span className="mt-0.5 block text-sm text-slate-600">
            When this is on, people who sign up can’t log in until an admin approves them on the
            Users page.
          </span>
        </span>
      </label>
      {update.error && (
        <Alert variant="error" className="mt-3">
          {update.error.message}
        </Alert>
      )}
    </Card>
  );
}
