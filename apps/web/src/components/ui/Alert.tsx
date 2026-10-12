import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type AlertVariant = 'info' | 'success' | 'error';

const variants: Record<AlertVariant, string> = {
  info: 'border-slate-200 bg-slate-50 text-slate-700',
  success: 'border-brand-200 bg-brand-50 text-brand-900',
  error: 'border-red-200 bg-red-50 text-red-800',
};

export function Alert({
  variant = 'info',
  className,
  children,
}: {
  variant?: AlertVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn('rounded-lg border px-3 py-2.5 text-sm', variants[variant], className)}
    >
      {children}
    </div>
  );
}
