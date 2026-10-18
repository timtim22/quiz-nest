import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

type SubjectSummaryDto = {
  id: string;
  name: string;
  description: string | null;
  chapterCount: number;
  createdAt: string;
};

type SubjectDetailDto = {
  id: string;
  name: string;
  description: string | null;
  chapters: {
    id: string;
    subjectId: string;
    title: string;
    position: number;
    topics: {
      id: string;
      chapterId: string;
      title: string;
      position: number;
    }[];
  }[];
};

type CreateSubjectInput = { name: string; description?: string | null };
type UpdateSubjectInput = Partial<CreateSubjectInput>;
type CreateChapterInput = { title: string };
type UpdateChapterInput = Partial<CreateChapterInput>;
type CreateTopicInput = { title: string };
type UpdateTopicInput = Partial<CreateTopicInput>;

async function handleConflict<T>(fn: () => Promise<T>, message: string): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new ConflictException(message);
    }
    throw e;
  }
}

@Injectable()
export class CurriculumService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Subjects ----------
  async listSubjects(ownerId: string): Promise<SubjectSummaryDto[]> {
    const rows = await (this.prisma as any).subject.findMany({
      where: { ownerId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { chapters: true } } },
    });
    return rows.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      chapterCount: s._count.chapters,
      createdAt: s.createdAt.toISOString(),
    }));
  }

  async getSubject(ownerId: string, id: string): Promise<SubjectDetailDto> {
    const s = await (this.prisma as any).subject.findFirst({
      where: { id, ownerId },
      include: {
        chapters: {
          orderBy: { position: 'asc' },
          include: { topics: { orderBy: { position: 'asc' } } },
        },
      },
    });
    if (!s) throw new NotFoundException('Subject not found');
    return {
      id: s.id,
      name: s.name,
      description: s.description,
      chapters: s.chapters.map((c) => ({
        id: c.id,
        subjectId: c.subjectId,
        title: c.title,
        position: c.position,
        topics: c.topics.map((t) => ({
          id: t.id,
          chapterId: t.chapterId,
          title: t.title,
          position: t.position,
        })),
      })),
    };
  }

  createSubject(ownerId: string, input: CreateSubjectInput) {
    return handleConflict(
      () => this.prisma.subject.create({ data: { ...input, ownerId } }),
      'You already have a subject with that name',
    );
  }

  async updateSubject(ownerId: string, id: string, input: UpdateSubjectInput) {
    await this.assertSubject(ownerId, id);
    return handleConflict(
      () => this.prisma.subject.update({ where: { id }, data: input }),
      'You already have a subject with that name',
    );
  }

  async deleteSubject(ownerId: string, id: string) {
    await this.assertSubject(ownerId, id);
    await this.prisma.subject.delete({ where: { id } });
  }

  // ---------- Chapters ----------
  async createChapter(ownerId: string, subjectId: string, input: CreateChapterInput) {
    await this.assertSubject(ownerId, subjectId);
    const last = await this.prisma.chapter.aggregate({
      where: { subjectId },
      _max: { position: true },
    });
    return handleConflict(
      () =>
        this.prisma.chapter.create({
          data: { subjectId, title: input.title, position: (last._max.position ?? -1) + 1 },
        }),
      'This subject already has a chapter with that title',
    );
  }

  async updateChapter(ownerId: string, id: string, input: UpdateChapterInput) {
    await this.assertChapter(ownerId, id);
    return handleConflict(
      () => this.prisma.chapter.update({ where: { id }, data: input }),
      'This subject already has a chapter with that title',
    );
  }

  async deleteChapter(ownerId: string, id: string) {
    await this.assertChapter(ownerId, id);
    await this.prisma.chapter.delete({ where: { id } });
  }

  // ---------- Topics ----------
  async createTopic(ownerId: string, chapterId: string, input: CreateTopicInput) {
    await this.assertChapter(ownerId, chapterId);
    const last = await this.prisma.topic.aggregate({
      where: { chapterId },
      _max: { position: true },
    });
    return handleConflict(
      () =>
        this.prisma.topic.create({
          data: { chapterId, title: input.title, position: (last._max.position ?? -1) + 1 },
        }),
      'This chapter already has a topic with that title',
    );
  }

  async updateTopic(ownerId: string, id: string, input: UpdateTopicInput) {
    await this.assertTopic(ownerId, id);
    return handleConflict(
      () => this.prisma.topic.update({ where: { id }, data: input }),
      'This chapter already has a topic with that title',
    );
  }

  async deleteTopic(ownerId: string, id: string) {
    await this.assertTopic(ownerId, id);
    await this.prisma.topic.delete({ where: { id } });
  }

  // ---------- Ownership checks (404 rather than 403 so ids aren't leaked) ----------
  private async assertSubject(ownerId: string, id: string) {
    const found = await this.prisma.subject.findFirst({ where: { id, ownerId }, select: { id: true } });
    if (!found) throw new NotFoundException('Subject not found');
  }
  private async assertChapter(ownerId: string, id: string) {
    const found = await this.prisma.chapter.findFirst({
      where: { id, subject: { ownerId } },
      select: { id: true },
    });
    if (!found) throw new NotFoundException('Chapter not found');
  }
  private async assertTopic(ownerId: string, id: string) {
    const found = await this.prisma.topic.findFirst({
      where: { id, chapter: { subject: { ownerId } } },
      select: { id: true },
    });
    if (!found) throw new NotFoundException('Topic not found');
  }
}
