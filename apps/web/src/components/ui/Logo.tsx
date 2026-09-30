import { cn } from '@/lib/cn';

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-semibold text-brand-900', className)}>
      <span
        aria-hidden
        className="grid size-8 place-items-center rounded-lg bg-brand-800 text-base font-bold text-gold-400"
      >
        Q
      </span>
      <span className="text-lg tracking-tight">Quiz Nest</span>
    </span>
  );
}
