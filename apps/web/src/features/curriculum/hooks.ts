import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';

export const curriculumKeys = {
  all: ['curriculum'] as const,
  subjects: () => [...curriculumKeys.all, 'subjects'] as const,
  subject: (id: string) => [...curriculumKeys.subjects(), id] as const,
};

export const useSubjects = () =>
  useQuery({ queryKey: curriculumKeys.subjects(), queryFn: api.listSubjects });

export const useSubject = (id: string) =>
  useQuery({ queryKey: curriculumKeys.subject(id), queryFn: () => api.getSubject(id) });

/** Every change refreshes the subject list and the open subject, so counts stay right. */
function useCurriculumMutation<TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: curriculumKeys.all }),
  });
}

export const useCreateSubject = () => useCurriculumMutation(api.createSubject);
export const useUpdateSubject = () =>
  useCurriculumMutation((v: { id: string; name: string }) =>
    api.updateSubject(v.id, { name: v.name }),
  );
export const useDeleteSubject = () => useCurriculumMutation(api.deleteSubject);

export const useCreateChapter = (subjectId: string) =>
  useCurriculumMutation((name: string) => api.createChapter(subjectId, { name }));
export const useUpdateChapter = () =>
  useCurriculumMutation((v: { id: string; name: string }) =>
    api.updateChapter(v.id, { name: v.name }),
  );
export const useDeleteChapter = () => useCurriculumMutation(api.deleteChapter);

export const useCreateTopic = (chapterId: string) =>
  useCurriculumMutation((name: string) => api.createTopic(chapterId, { name }));
export const useUpdateTopic = () =>
  useCurriculumMutation((v: { id: string; name: string }) =>
    api.updateTopic(v.id, { name: v.name }),
  );
export const useDeleteTopic = () => useCurriculumMutation(api.deleteTopic);
