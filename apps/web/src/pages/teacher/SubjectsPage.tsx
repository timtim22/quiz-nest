import { ChevronRight, Library } from 'lucide-react';
import { Link } from 'react-router';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { InlineAddForm } from '@/features/curriculum/components/InlineAddForm';
import { useCreateSubject, useSubjects } from '@/features/curriculum/hooks';

export function SubjectsPage() {
  const { data: subjects, isPending, error } = useSubjects();
  const createSubject = useCreateSubject();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Subjects</h1>
        <p className="mt-1 text-sm text-slate-600">
          Organise your questions into subjects, chapters and topics.
        </p>
      </div>

      <Card>
        <InlineAddForm
          label="New subject name"
          placeholder="Add a subject, e.g. Physics"
          buttonText="Add subject"
          pending={createSubject.isPending}
          error={createSubject.error?.message}
          onSubmit={(name) => createSubject.mutateAsync({ name })}
        />
      </Card>

      {isPending && <p className="text-sm text-slate-500">Loading subjects…</p>}
      {error && <Alert variant="error">{error.message}</Alert>}

      {subjects?.length === 0 && (
        <Card className="flex flex-col items-center gap-2 py-10 text-center">
          <Library className="size-8 text-brand-300" aria-hidden />
          <p className="font-medium text-slate-900">No subjects yet</p>
          <p className="text-sm text-slate-600">Add your first subject above to get started.</p>
        </Card>
      )}

      {subjects && subjects.length > 0 && (
        <ul className="space-y-2">
          {subjects.map((subject) => (
            <li key={subject.id}>
              <Link
                to={subject.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-colors hover:border-brand-300 hover:bg-brand-50/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900" dir="auto">
                    {subject.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {subject.chapterCount} {subject.chapterCount === 1 ? 'chapter' : 'chapters'}
                  </p>
                </div>
                <ChevronRight className="size-5 text-slate-400 rtl:rotate-180" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
