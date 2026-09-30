import { Link, Outlet } from 'react-router';
import { Logo } from '@/components/ui/Logo';

/**
 * Deliberately plain: students are often on cheap phones and slow connections.
 * (The exam screen itself will get its own, even simpler layout.)
 */
export function StudentLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-14 shrink-0 items-center border-b border-slate-200 bg-white px-4">
        <Link to="/">
          <Logo />
        </Link>
      </header>
      <main className="flex flex-1 justify-center px-4 py-8 sm:items-center">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
