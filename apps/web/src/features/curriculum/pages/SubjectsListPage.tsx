import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { InlineAddForm } from '../components/InlineAddForm';
import { useCreateSubject, useDeleteSubject, useSubjects } from '../hooks';

export default function SubjectsListPage() {
  const { data, isLoading, isError } = useSubjects();
  const create = useCreateSubject();
  const remove = useDeleteSubject();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold text-amber-400">Subjects</h1>

      <InlineAddForm
        placeholder="New subject name…"
        pending={create.isPending}
        error={create.error?.message}
        onSubmit={(name) => create.mutateAsync({ name })}
      />

      {isLoading && <p className="text-emerald-200">Loading…</p>}
      {isError && <p className="text-red-400">Could not load subjects.</p>}
      {data?.length === 0 && <p className="text-emerald-200">No subjects yet. Add your first one above.</p>}

      <ul className="space-y-2">
        {data?.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between rounded-lg border border-emerald-800 bg-emerald-900/60 p-4"
          >
            <Link to={s.id} className="flex-1">
              <div className="font-medium text-emerald-50">{s.name}</div>
              <div className="text-xs text-emerald-300">
                {s.chapterCount} chapter{s.chapterCount === 1 ? '' : 's'}
              </div>
            </Link>
            <button
              aria-label={`Delete ${s.name}`}
              onClick={() =>
                window.confirm(`Delete "${s.name}" and all its chapters and topics?`) &&
                remove.mutate(s.id)
              }
              className="text-emerald-300 hover:text-red-400"
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
