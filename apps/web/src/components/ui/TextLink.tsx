import { Link, type LinkProps } from 'react-router';
import { cn } from '@/lib/cn';

/** An inline link inside text. */
export function TextLink({ className, ...props }: LinkProps) {
  return (
    <Link
      className={cn(
        'font-medium text-brand-700 underline-offset-2 hover:text-brand-800 hover:underline',
        className,
      )}
      {...props}
    />
  );
}
