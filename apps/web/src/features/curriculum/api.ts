import type {
  ChapterDto,
  CreateChapterInput,
  CreateSubjectInput,
  CreateTopicInput,
  SubjectDetailDto,
  SubjectSummaryDto,
  TopicDto,
  UpdateChapterInput,
  UpdateSubjectInput,
  UpdateTopicInput,
} from '@quiz-nest/shared';
import { apiClient } from '@/lib/api-client';

export const listSubjects = () => apiClient.get<SubjectSummaryDto[]>('/subjects');
export const getSubject = (id: string) => apiClient.get<SubjectDetailDto>(`/subjects/${id}`);
export const createSubject = (input: CreateSubjectInput) =>
  apiClient.post<SubjectSummaryDto>('/subjects', input);
export const updateSubject = (id: string, input: UpdateSubjectInput) =>
  apiClient.patch<SubjectSummaryDto>(`/subjects/${id}`, input);
export const deleteSubject = (id: string) => apiClient.delete<null>(`/subjects/${id}`);

export const createChapter = (subjectId: string, input: CreateChapterInput) =>
  apiClient.post<ChapterDto>(`/subjects/${subjectId}/chapters`, input);
export const updateChapter = (id: string, input: UpdateChapterInput) =>
  apiClient.patch<ChapterDto>(`/chapters/${id}`, input);
export const deleteChapter = (id: string) => apiClient.delete<null>(`/chapters/${id}`);

export const createTopic = (chapterId: string, input: CreateTopicInput) =>
  apiClient.post<TopicDto>(`/chapters/${chapterId}/topics`, input);
export const updateTopic = (id: string, input: UpdateTopicInput) =>
  apiClient.patch<TopicDto>(`/topics/${id}`, input);
export const deleteTopic = (id: string) => apiClient.delete<null>(`/topics/${id}`);
