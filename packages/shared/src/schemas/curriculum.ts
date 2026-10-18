import { z } from 'zod';

const name = z.string().trim().min(1, 'Required').max(120, 'Max 120 characters');

export const createSubjectSchema = z.object({
  name,
  description: z.string().trim().max(500).optional().nullable(),
});
export const updateSubjectSchema = createSubjectSchema.partial();

export const createChapterSchema = z.object({ title: name });
export const updateChapterSchema = createChapterSchema.partial();

export const createTopicSchema = z.object({ title: name });
export const updateTopicSchema = createTopicSchema.partial();

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type CreateChapterInput = z.infer<typeof createChapterSchema>;
export type UpdateChapterInput = z.infer<typeof updateChapterSchema>;
export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;

export interface TopicDto {
  id: string;
  chapterId: string;
  title: string;
  position: number;
}
export interface ChapterDto {
  id: string;
  subjectId: string;
  title: string;
  position: number;
  topics: TopicDto[];
}
export interface SubjectSummaryDto {
  id: string;
  name: string;
  description: string | null;
  chapterCount: number;
  createdAt: string;
}
export interface SubjectDetailDto {
  id: string;
  name: string;
  description: string | null;
  chapters: ChapterDto[];
}
