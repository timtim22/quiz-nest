import { type InputHTMLAttributes, useId } from 'react';
import { cn } from '@/lib/cn';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

/** A labelled input with optional hint and error text, wired up for screen readers. */
export function TextField({ label, hint, error, id, className, ...props }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint && !error ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={className}>
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-800">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={hintId ?? errorId}
        className={cn(
          // text-base (16px) stops iOS from zooming in when the field is focused.
          'mt-1.5 block h-11 w-full rounded-lg border bg-white px-3 text-base text-slate-900 shadow-xs',
          'placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 focus:outline-none',
          'disabled:cursor-not-allowed disabled:bg-slate-50',
          error ? 'border-red-500' : 'border-slate-300',
        )}
        {...props}
      />
      {hintId && (
        <p id={hintId} className="mt-1.5 text-sm text-slate-500">
          {hint}
        </p>
      )}
      {errorId && (
        <p id={errorId} className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
