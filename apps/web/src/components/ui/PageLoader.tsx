import { LoaderCircle } from 'lucide-react';

/** Full-page loading state, e.g. while checking whether the teacher is logged in. */
export function PageLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center" role="status">
      <LoaderCircle className="size-6 animate-spin text-brand-700" aria-hidden />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
