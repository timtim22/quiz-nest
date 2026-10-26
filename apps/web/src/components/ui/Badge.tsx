import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type BadgeTone = 'green' | 'gold' | 'red' | 'slate';

const tones: Record<BadgeTone, string> = {
  green: 'bg-brand-50 text-brand-800 ring-brand-200',
  gold: 'bg-gold-50 text-gold-700 ring-gold-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
};

/** A small coloured label, e.g. a status. */
export function Badge({ tone = 'slate', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
