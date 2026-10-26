import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { ChapterCard } from '@/features/curriculum/components/ChapterCard';
import { EditableName } from '@/features/curriculum/components/EditableName';
import { InlineAddForm } from '@/features/curriculum/components/InlineAddForm';
import {
  useCreateChapter,
  useDeleteSubject,
  useSubject,
  useUpdateSubject,
} from '@/features/curriculum/hooks';

export function SubjectDetailPage() {
  const { subjectId = '' } = useParams();
  const navigate = useNavigate();
  const { data: subject, isPending, error } = useSubject(subjectId);
  const renameSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();
  const createChapter = useCreateChapter(subjectId);

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        to="/teacher/subjects"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
        All subjects
      </Link>

      {isPending && <p className="text-sm text-slate-500">Loading…</p>}
      {error && <Alert variant="error">{error.message}</Alert>}

      {subject && (
        <>
          <EditableName
            name={subject.name}
            kind="subject"
            className="text-2xl font-semibold text-slate-900"
            confirmDelete={`Delete "${subject.name}" and all its chapters and topics?`}
            onRename={(name) => renameSubject.mutateAsync({ id: subject.id, name })}
            onDelete={async () => {
              await deleteSubject.mutateAsync(subject.id);
              navigate('/teacher/subjects', { replace: true });
            }}
          />

          <section aria-labelledby="chapters-heading" className="space-y-3">
            <h2 id="chapters-heading" className="text-base font-semibold text-slate-900">
              Chapters
            </h2>

            {subject.chapters.length === 0 && (
              <p className="text-sm text-slate-500">No chapters yet. Add the first one below.</p>
            )}
            {subject.chapters.map((chapter) => (
              <ChapterCard key={chapter.id} chapter={chapter} />
            ))}

            <Card>
              <InlineAddForm
                label="New chapter name"
                placeholder="Add a chapter, e.g. Motion"
                buttonText="Add chapter"
                pending={createChapter.isPending}
                error={createChapter.error?.message}
                onSubmit={(name) => createChapter.mutateAsync(name)}
              />
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
