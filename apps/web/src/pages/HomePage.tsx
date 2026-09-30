import { ArrowRight, BookOpenCheck, GraduationCap, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { ButtonLink } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/cn';

export function HomePage() {
  return (
    <div className="min-h-dvh bg-white">
      <header className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <ButtonLink to="/login" variant="secondary" size="sm">
          Teacher login
        </ButtonLink>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-10 pb-16 sm:px-6 sm:pt-20">
        <p className="text-sm font-semibold tracking-wider text-gold-600 uppercase">
          Online examinations
        </p>
        <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight text-balance text-brand-950 sm:text-5xl">
          Exams that keep working when the internet doesn’t.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-slate-600">
          Build question banks, run timed exams and publish results. Students’ answers are saved on
          their device, so a dropped connection never costs them their work.
        </p>

        <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-2">
          <RoleCard
            to="/student/join"
            icon={GraduationCap}
            title="I’m a student"
            description="Enter your exam code and roll number to begin."
            cta="Join an exam"
            highlighted
          />
          <RoleCard
            to="/login"
            icon={BookOpenCheck}
            title="I’m a teacher"
            description="Create questions, build exams and follow them live."
            cta="Log in"
          />
        </div>
      </main>
    </div>
  );
}

interface RoleCardProps {
  to: string;
  icon: LucideIcon;
  title: string;
  description: string;
  cta: string;
  highlighted?: boolean;
}

function RoleCard({ to, icon: Icon, title, description, cta, highlighted }: RoleCardProps) {
  return (
    <Link
      to={to}
      className={cn(
        'group rounded-xl border p-5 transition-colors',
        highlighted
          ? 'border-brand-800 bg-brand-800 text-white hover:bg-brand-700'
          : 'border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/50',
      )}
    >
      <Icon
        className={cn('size-7', highlighted ? 'text-gold-400' : 'text-brand-700')}
        aria-hidden
      />
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className={cn('mt-1 text-sm', highlighted ? 'text-brand-100' : 'text-slate-600')}>
        {description}
      </p>
      <span
        className={cn(
          'mt-4 inline-flex items-center gap-1.5 text-sm font-semibold',
          highlighted ? 'text-gold-300' : 'text-brand-700',
        )}
      >
        {cta}
        <ArrowRight
          className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180"
          aria-hidden
        />
      </span>
    </Link>
  );
}
