import { z } from 'zod';

// Subjects contain chapters, chapters contain topics. Questions (QN-5) are tagged with all three.

const name = z.string().trim().min(1, 'Enter a name.').max(120, 'Use 120 characters or fewer.');
const description = z.string().trim().max(500, 'Use 500 characters or fewer.');

export const createSubjectSchema = z.object({ name, description: description.optional() });
export const updateSubjectSchema = createSubjectSchema.partial();

export const createChapterSchema = z.object({ name });
export const updateChapterSchema = createChapterSchema.partial();

export const createTopicSchema = z.object({ name });
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
  name: string;
  position: number;
}

export interface ChapterDto {
  id: string;
  subjectId: string;
  name: string;
  position: number;
  topics: TopicDto[];
}

/** One row on the subjects list. */
export interface SubjectSummaryDto {
  id: string;
  name: string;
  description: string | null;
  chapterCount: number;
  createdAt: string;
}

/** A subject with all its chapters and topics, in order. */
export interface SubjectDetailDto {
  id: string;
  name: string;
  description: string | null;
  chapters: ChapterDto[];
}
