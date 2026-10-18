import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UpdateChapterInput, UpdateSubjectInput } from '@quiz-nest/shared';
import { curriculumApi } from './api';

const ROOT = ['subjects'] as const; // detail keys are ['subjects', id] so one invalidation refreshes everything

export const useSubjects = () =>
  useQuery({ queryKey: ROOT, queryFn: curriculumApi.listSubjects });

export const useSubject = (id: string) =>
  useQuery({ queryKey: [...ROOT, id], queryFn: () => curriculumApi.getSubject(id) });

function useCurriculumMutation<TVars>(fn: (vars: TVars) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ROOT }),
  });
}

export const useCreateSubject = () => useCurriculumMutation(curriculumApi.createSubject);
export const useUpdateSubject = () =>
  useCurriculumMutation((v: { id: string; input: UpdateSubjectInput }) =>
    curriculumApi.updateSubject(v.id, v.input));
export const useDeleteSubject = () => useCurriculumMutation(curriculumApi.deleteSubject);

export const useCreateChapter = () =>
  useCurriculumMutation((v: { subjectId: string; title: string }) =>
    curriculumApi.createChapter(v.subjectId, { title: v.title }));
export const useUpdateChapter = () =>
  useCurriculumMutation((v: { id: string; input: UpdateChapterInput }) =>
    curriculumApi.updateChapter(v.id, v.input));
export const useDeleteChapter = () => useCurriculumMutation(curriculumApi.deleteChapter);

export const useCreateTopic = () =>
  useCurriculumMutation((v: { chapterId: string; title: string }) =>
    curriculumApi.createTopic(v.chapterId, { title: v.title }));
export const useUpdateTopic = () =>
  useCurriculumMutation((v: { id: string; input: Parameters<typeof curriculumApi.updateTopic>[1] }) =>
    curriculumApi.updateTopic(v.id, v.input));
export const useDeleteTopic = () => useCurriculumMutation(curriculumApi.deleteTopic);
