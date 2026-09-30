import { isRouteErrorResponse, useRouteError } from 'react-router';
import { Button } from '@/components/ui/Button';
import { NotFoundPage } from './NotFoundPage';

/** Shown when a page throws while rendering, instead of a blank screen. */
export function RouteErrorPage() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;

  if (import.meta.env.DEV) console.error(error);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Something went wrong</h1>
      <p className="mt-2 text-slate-600">Please reload the page. If it keeps happening, tell us.</p>
      <Button className="mt-6" onClick={() => window.location.reload()}>
        Reload page
      </Button>
    </div>
  );
}
