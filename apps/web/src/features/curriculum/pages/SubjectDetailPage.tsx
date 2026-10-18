import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { EditableText } from '../components/EditableText';
import { InlineAddForm } from '../components/InlineAddForm';
import {
  useCreateChapter,
  useCreateTopic,
  useDeleteChapter,
  useDeleteSubject,
  useDeleteTopic,
  useSubject,
  useUpdateChapter,
  useUpdateSubject,
  useUpdateTopic,
} from '../hooks';

export default function SubjectDetailPage() {
  const { subjectId = '' } = useParams();
  const navigate = useNavigate();
  const { data: subject, isLoading, isError } = useSubject(subjectId);

  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();
  const createChapter = useCreateChapter();
  const updateChapter = useUpdateChapter();
  const deleteChapter = useDeleteChapter();
  const createTopic = useCreateTopic();
  const updateTopic = useUpdateTopic();
  const deleteTopic = useDeleteTopic();

  if (isLoading) return <p className="p-6 text-emerald-200">Loading…</p>;
  if (isError || !subject) return <p className="p-6 text-red-400">Subject not found.</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <Link to=".." relative="path" className="inline-flex items-center gap-1 text-sm text-emerald-300 hover:text-amber-400">
        <ArrowLeft size={14} /> All subjects
      </Link>

      <header className="flex items-center gap-2">
        <EditableText
          value={subject.name}
          className="text-2xl font-semibold text-amber-400"
          confirmMessage={`Delete "${subject.name}" and everything in it?`}
          onSave={(name) => updateSubject.mutateAsync({ id: subject.id, input: { name } })}
          onDelete={async () => {
            await deleteSubject.mutateAsync(subject.id);
            navigate('..', { relative: 'path' });
          }}
        />
      </header>
      {updateSubject.error && <p className="text-xs text-red-400">{updateSubject.error.message}</p>}

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-emerald-50">Chapters</h2>

        {subject.chapters.length === 0 && (
          <p className="text-emerald-200">No chapters yet.</p>
        )}

        {subject.chapters.map((chapter) => (
          <div key={chapter.id} className="space-y-3 rounded-lg border border-emerald-800 bg-emerald-900/60 p-4">
            <div className="flex">
              <EditableText
                value={chapter.title}
                className="font-medium text-emerald-50"
                confirmMessage={`Delete chapter "${chapter.title}" and its topics?`}
                onSave={(title) => updateChapter.mutateAsync({ id: chapter.id, input: { title } })}
                onDelete={() => deleteChapter.mutateAsync(chapter.id)}
              />
            </div>

            <ul className="space-y-1 border-l border-emerald-800 pl-4">
              {chapter.topics.map((topic) => (
                <li key={topic.id} className="flex">
                  <EditableText
                    value={topic.title}
                    className="text-sm text-emerald-100"
                    confirmMessage={`Delete topic "${topic.title}"?`}
                    onSave={(title) => updateTopic.mutateAsync({ id: topic.id, input: { title } })}
                    onDelete={() => deleteTopic.mutateAsync(topic.id)}
                  />
                </li>
              ))}
            </ul>

            <InlineAddForm
              placeholder="New topic…"
              pending={createTopic.isPending}
              error={createTopic.error?.message}
              onSubmit={(title) => createTopic.mutateAsync({ chapterId: chapter.id, title })}
            />
          </div>
        ))}

        <InlineAddForm
          placeholder="New chapter…"
          pending={createChapter.isPending}
          error={createChapter.error?.message}
          onSubmit={(title) => createChapter.mutateAsync({ subjectId: subject.id, title })}
        />
      </section>
    </div>
  );
}
