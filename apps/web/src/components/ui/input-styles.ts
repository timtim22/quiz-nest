import { cn } from '@/lib/cn';

/** Styling for every text input, so inline inputs match TextField. */
export function inputClasses(hasError = false, className?: string): string {
  return cn(
    // text-base (16px) stops iOS from zooming in when the field is focused.
    'block h-11 w-full rounded-lg border bg-white px-3 text-base text-slate-900 shadow-xs',
    'placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 focus:outline-none',
    'disabled:cursor-not-allowed disabled:bg-slate-50',
    hasError ? 'border-red-500' : 'border-slate-300',
    className,
  );
}
