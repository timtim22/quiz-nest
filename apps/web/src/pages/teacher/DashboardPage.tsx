import { BookOpen, CalendarClock, PenLine, Plus, Radio } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { SystemStatusCard } from '@/features/health/SystemStatusCard';

// TODO(QN-20): load real numbers and wire up the quick actions.
export function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            An overview of your questions, exams and marking.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" disabled>
            <Plus className="size-4" aria-hidden />
            New question
          </Button>
          <Button disabled>
            <Plus className="size-4" aria-hidden />
            New exam
          </Button>
        </div>
      </div>

      <section aria-label="Statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Questions in bank" value="–" icon={BookOpen} />
        <StatCard label="Active exams" value="–" icon={Radio} />
        <StatCard label="Upcoming exams" value="–" icon={CalendarClock} />
        <StatCard label="Awaiting marking" value="–" icon={PenLine} />
      </section>

      <div className="max-w-md">
        <SystemStatusCard />
      </div>
    </div>
  );
}
