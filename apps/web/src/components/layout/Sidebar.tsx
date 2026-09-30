import {
  BarChart3,
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  type LucideIcon,
  Users,
} from 'lucide-react';
import { Link, NavLink } from 'react-router';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/cn';

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Shown greyed out until the page exists. Remove the flag when you build it. */
  comingSoon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/teacher/dashboard', icon: LayoutDashboard },
  { label: 'Question bank', to: '/teacher/questions', icon: BookOpen, comingSoon: true },
  { label: 'Exams', to: '/teacher/exams', icon: ClipboardList, comingSoon: true },
  { label: 'Students', to: '/teacher/students', icon: Users, comingSoon: true },
  { label: 'Analytics', to: '/teacher/analytics', icon: BarChart3, comingSoon: true },
];

const itemClasses = 'flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium';

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center border-b border-slate-200 px-5">
        <Link to="/teacher/dashboard" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>

      <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map(({ label, to, icon: Icon, comingSoon }) =>
          comingSoon ? (
            <span
              key={to}
              aria-disabled
              className={cn(itemClasses, 'cursor-default text-slate-400')}
            >
              <Icon className="size-5" aria-hidden />
              {label}
              <span className="ms-auto rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
                Soon
              </span>
            </span>
          ) : (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  itemClasses,
                  isActive
                    ? 'bg-brand-50 text-brand-800'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
                )
              }
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </NavLink>
          ),
        )}
      </nav>
    </div>
  );
}
