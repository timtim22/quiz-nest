import type {
  CreateSubjectInput,
  CreateTopicInput,
  SubjectDetailDto,
  SubjectSummaryDto,
  UpdateChapterInput,
} from '@quiz-nest/shared';
// Use your shared API client from QN-1. Assumed shape: api.get<T>(path), api.post<T>(path, body),
// api.patch<T>(path, body), api.delete(path). Adjust the import/method names if yours differ.
import { api } from '../../lib/api';

type CreateChapterInput = object;
type UpdateTopicInput = object;
type UpdateSubjectInput = object;

export const curriculumApi = {
  listSubjects: () => api.get<SubjectSummaryDto[]>('/subjects'),
  getSubject: (id: string) => api.get<SubjectDetailDto>(`/subjects/${id}`),
  createSubject: (input: CreateSubjectInput) => api.post<{ id: string }>('/subjects', input),
  updateSubject: (id: string, input: UpdateSubjectInput) => api.patch(`/subjects/${id}`, input),
  deleteSubject: (id: string) => api.delete(`/subjects/${id}`),

  createChapter: (subjectId: string, input: CreateChapterInput) =>
    api.post(`/subjects/${subjectId}/chapters`, input),
  updateChapter: (id: string, input: UpdateChapterInput) => api.patch(`/chapters/${id}`, input),
  deleteChapter: (id: string) => api.delete(`/chapters/${id}`),

  createTopic: (chapterId: string, input: CreateTopicInput) =>
    api.post(`/chapters/${chapterId}/topics`, input),
  updateTopic: (id: string, input: UpdateTopicInput) => api.patch(`/topics/${id}`, input),
  deleteTopic: (id: string) => api.delete(`/topics/${id}`),
};
