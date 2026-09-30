import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  hint?: string;
}

export function StatCard({ label, value, icon: Icon, hint }: StatCardProps) {
  return (
    <Card className="flex items-start gap-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-slate-600">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
    </Card>
  );
}
