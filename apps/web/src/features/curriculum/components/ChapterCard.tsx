import type { ChapterDto } from '@quiz-nest/shared';
import { Card } from '@/components/ui/Card';
import {
  useCreateTopic,
  useDeleteChapter,
  useDeleteTopic,
  useUpdateChapter,
  useUpdateTopic,
} from '../hooks';
import { EditableName } from './EditableName';
import { InlineAddForm } from './InlineAddForm';

/** One chapter with its topics. Each card has its own "add topic" form and errors. */
export function ChapterCard({ chapter }: { chapter: ChapterDto }) {
  const renameChapter = useUpdateChapter();
  const deleteChapter = useDeleteChapter();
  const createTopic = useCreateTopic(chapter.id);
  const renameTopic = useUpdateTopic();
  const deleteTopic = useDeleteTopic();

  return (
    <Card className="space-y-3">
      <EditableName
        name={chapter.name}
        kind="chapter"
        className="font-semibold text-slate-900"
        confirmDelete={`Delete chapter "${chapter.name}" and all its topics?`}
        onRename={(name) => renameChapter.mutateAsync({ id: chapter.id, name })}
        onDelete={() => deleteChapter.mutateAsync(chapter.id)}
      />

      {chapter.topics.length > 0 ? (
        <ul className="space-y-1 border-s-2 border-brand-100 ps-3">
          {chapter.topics.map((topic) => (
            <li key={topic.id}>
              <EditableName
                name={topic.name}
                kind="topic"
                className="text-sm text-slate-700"
                confirmDelete={`Delete topic "${topic.name}"?`}
                onRename={(name) => renameTopic.mutateAsync({ id: topic.id, name })}
                onDelete={() => deleteTopic.mutateAsync(topic.id)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">No topics yet.</p>
      )}

      <InlineAddForm
        label={`New topic in ${chapter.name}`}
        placeholder="Add a topic, e.g. Velocity"
        pending={createTopic.isPending}
        error={createTopic.error?.message}
        onSubmit={(name) => createTopic.mutateAsync(name)}
      />
    </Card>
  );
}
