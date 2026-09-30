import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, Outlet } from 'react-router';
import { Logo } from '@/components/ui/Logo';
import { Sidebar } from './Sidebar';

/**
 * Shell for every /teacher page: sidebar on desktop, slide-over menu on phones.
 * Uses start/end (not left/right) spacing so it flips correctly for Urdu (RTL).
 */
export function TeacherLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-dvh lg:flex">
      <aside className="hidden border-e border-slate-200 bg-white lg:sticky lg:top-0 lg:block lg:h-dvh lg:w-64 lg:shrink-0">
        <Sidebar />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal aria-label="Menu">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            aria-label="Close menu"
            onClick={closeMenu}
          />
          <aside className="absolute inset-y-0 start-0 w-72 max-w-[85vw] bg-white shadow-xl">
            <button
              type="button"
              className="absolute end-3 top-3.5 grid size-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Close menu"
              onClick={closeMenu}
            >
              <X className="size-5" aria-hidden />
            </button>
            <Sidebar onNavigate={closeMenu} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
          <button
            type="button"
            className="-ms-2 grid size-10 place-items-center rounded-lg text-slate-700 hover:bg-slate-100 lg:hidden"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <Link to="/teacher/dashboard" className="lg:hidden">
            <Logo />
          </Link>

          {/* TODO(QN-2): show the logged-in teacher and make this log out for real. */}
          <div className="ms-auto flex items-center gap-2">
            <span className="hidden text-sm text-slate-600 sm:inline">Teacher</span>
            <Link
              to="/"
              className="grid size-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="size-5" aria-hidden />
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
