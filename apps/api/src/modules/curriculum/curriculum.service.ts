import { HttpStatus, Injectable } from '@nestjs/common';
import {
  type ChapterDto,
  type CreateChapterInput,
  type CreateSubjectInput,
  type CreateTopicInput,
  ErrorCode,
  type SubjectDetailDto,
  type SubjectSummaryDto,
  type TopicDto,
  type UpdateChapterInput,
  type UpdateSubjectInput,
  type UpdateTopicInput,
} from '@quiz-nest/shared';
import { AppException } from '../../common/errors/app.exception.js';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const SUBJECT_SUMMARY = { _count: { select: { chapters: true } } } satisfies Prisma.SubjectInclude;
type SubjectSummaryRecord = Prisma.SubjectGetPayload<{ include: typeof SUBJECT_SUMMARY }>;

const IN_ORDER = [
  { position: 'asc' },
  { createdAt: 'asc' },
] satisfies Prisma.ChapterOrderByWithRelationInput[];

/**
 * Subjects, chapters and topics for one organization (school).
 * Every method takes the caller's organizationId, so a teacher can never see or
 * change another school's data. Missing and not-yours both give 404, so ids from
 * other schools aren't revealed.
 */
@Injectable()
export class CurriculumService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Subjects ----------

  async listSubjects(organizationId: string): Promise<SubjectSummaryDto[]> {
    const subjects = await this.prisma.subject.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
      include: SUBJECT_SUMMARY,
    });
    return subjects.map(toSubjectSummary);
  }

  async getSubject(organizationId: string, id: string): Promise<SubjectDetailDto> {
    const subject = await this.prisma.subject.findFirst({
      where: { id, organizationId },
      include: { chapters: { orderBy: IN_ORDER, include: { topics: { orderBy: IN_ORDER } } } },
    });
    if (!subject) throw notFound('Subject');

    return {
      id: subject.id,
      name: subject.name,
      description: subject.description,
      chapters: subject.chapters.map((chapter) => toChapter(chapter, chapter.topics)),
    };
  }

  async createSubject(
    organizationId: string,
    input: CreateSubjectInput,
  ): Promise<SubjectSummaryDto> {
    const subject = await uniqueName('You already have a subject with this name.', () =>
      this.prisma.subject.create({
        data: { organizationId, name: input.name, description: input.description || null },
        include: SUBJECT_SUMMARY,
      }),
    );
    return toSubjectSummary(subject);
  }

  async updateSubject(
    organizationId: string,
    id: string,
    input: UpdateSubjectInput,
  ): Promise<SubjectSummaryDto> {
    await this.assertSubject(organizationId, id);
    const subject = await uniqueName('You already have a subject with this name.', () =>
      this.prisma.subject.update({
        where: { id },
        data: {
          name: input.name,
          // An empty description clears it; leaving it out keeps it.
          description: input.description === undefined ? undefined : input.description || null,
        },
        include: SUBJECT_SUMMARY,
      }),
    );
    return toSubjectSummary(subject);
  }

  /** Also deletes the subject's chapters and topics. */
  async deleteSubject(organizationId: string, id: string): Promise<void> {
    await this.assertSubject(organizationId, id);
    await this.prisma.subject.delete({ where: { id } });
  }

  // ---------- Chapters ----------

  async createChapter(
    organizationId: string,
    subjectId: string,
    input: CreateChapterInput,
  ): Promise<ChapterDto> {
    await this.assertSubject(organizationId, subjectId);
    const last = await this.prisma.chapter.aggregate({
      where: { subjectId },
      _max: { position: true },
    });

    const chapter = await uniqueName('This subject already has a chapter with this name.', () =>
      this.prisma.chapter.create({
        data: { subjectId, name: input.name, position: (last._max.position ?? -1) + 1 },
      }),
    );
    return toChapter(chapter, []);
  }

  async updateChapter(
    organizationId: string,
    id: string,
    input: UpdateChapterInput,
  ): Promise<ChapterDto> {
    await this.assertChapter(organizationId, id);
    const chapter = await uniqueName('This subject already has a chapter with this name.', () =>
      this.prisma.chapter.update({
        where: { id },
        data: { name: input.name },
        include: { topics: { orderBy: IN_ORDER } },
      }),
    );
    return toChapter(chapter, chapter.topics);
  }

  /** Also deletes the chapter's topics. */
  async deleteChapter(organizationId: string, id: string): Promise<void> {
    await this.assertChapter(organizationId, id);
    await this.prisma.chapter.delete({ where: { id } });
  }

  // ---------- Topics ----------

  async createTopic(
    organizationId: string,
    chapterId: string,
    input: CreateTopicInput,
  ): Promise<TopicDto> {
    await this.assertChapter(organizationId, chapterId);
    const last = await this.prisma.topic.aggregate({
      where: { chapterId },
      _max: { position: true },
    });

    const topic = await uniqueName('This chapter already has a topic with this name.', () =>
      this.prisma.topic.create({
        data: { chapterId, name: input.name, position: (last._max.position ?? -1) + 1 },
      }),
    );
    return toTopic(topic);
  }

  async updateTopic(
    organizationId: string,
    id: string,
    input: UpdateTopicInput,
  ): Promise<TopicDto> {
    await this.assertTopic(organizationId, id);
    const topic = await uniqueName('This chapter already has a topic with this name.', () =>
      this.prisma.topic.update({ where: { id }, data: { name: input.name } }),
    );
    return toTopic(topic);
  }

  async deleteTopic(organizationId: string, id: string): Promise<void> {
    await this.assertTopic(organizationId, id);
    await this.prisma.topic.delete({ where: { id } });
  }

  // ---------- Ownership checks ----------

  private async assertSubject(organizationId: string, id: string) {
    const found = await this.prisma.subject.findFirst({
      where: { id, organizationId },
      select: { id: true },
    });
    if (!found) throw notFound('Subject');
  }

  private async assertChapter(organizationId: string, id: string) {
    const found = await this.prisma.chapter.findFirst({
      where: { id, subject: { organizationId } },
      select: { id: true },
    });
    if (!found) throw notFound('Chapter');
  }

  private async assertTopic(organizationId: string, id: string) {
    const found = await this.prisma.topic.findFirst({
      where: { id, chapter: { subject: { organizationId } } },
      select: { id: true },
    });
    if (!found) throw notFound('Topic');
  }
}

/** Turns the database's "duplicate name" error into a friendly 409. */
async function uniqueName<T>(message: string, write: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppException(ErrorCode.CONFLICT, message, HttpStatus.CONFLICT);
    }
    throw error;
  }
}

function notFound(what: string) {
  return new AppException(ErrorCode.NOT_FOUND, `${what} not found.`, HttpStatus.NOT_FOUND);
}

function toSubjectSummary(subject: SubjectSummaryRecord): SubjectSummaryDto {
  return {
    id: subject.id,
    name: subject.name,
    description: subject.description,
    chapterCount: subject._count.chapters,
    createdAt: subject.createdAt.toISOString(),
  };
}

function toChapter(
  chapter: { id: string; subjectId: string; name: string; position: number },
  topics: Parameters<typeof toTopic>[0][],
): ChapterDto {
  return {
    id: chapter.id,
    subjectId: chapter.subjectId,
    name: chapter.name,
    position: chapter.position,
    topics: topics.map(toTopic),
  };
}

function toTopic(topic: {
  id: string;
  chapterId: string;
  name: string;
  position: number;
}): TopicDto {
  return { id: topic.id, chapterId: topic.chapterId, name: topic.name, position: topic.position };
}
