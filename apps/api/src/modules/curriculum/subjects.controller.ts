import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
  type ChapterDto,
  type CreateChapterInput,
  createChapterSchema,
  type CreateSubjectInput,
  createSubjectSchema,
  type SubjectDetailDto,
  type SubjectSummaryDto,
  type UpdateSubjectInput,
  updateSubjectSchema,
} from '@quiz-nest/shared';
import { ParseIdPipe } from '../../common/pipes/parse-id.pipe.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import type { RequestUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/decorators.js';
import { CurriculumService } from './curriculum.service.js';

// Login is checked for every route by the global AuthGuard, so no guard is needed here.
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly curriculum: CurriculumService) {}

  @Get()
  list(@CurrentUser() user: RequestUser): Promise<SubjectSummaryDto[]> {
    return this.curriculum.listSubjects(user.organizationId);
  }

  @Get(':id')
  get(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseIdPipe) id: string,
  ): Promise<SubjectDetailDto> {
    return this.curriculum.getSubject(user.organizationId, id);
  }

  @Post()
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(createSubjectSchema)) body: CreateSubjectInput,
  ): Promise<SubjectSummaryDto> {
    return this.curriculum.createSubject(user.organizationId, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseIdPipe) id: string,
    @Body(new ZodValidationPipe(updateSubjectSchema)) body: UpdateSubjectInput,
  ): Promise<SubjectSummaryDto> {
    return this.curriculum.updateSubject(user.organizationId, id, body);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseIdPipe) id: string,
  ): Promise<null> {
    await this.curriculum.deleteSubject(user.organizationId, id);
    return null;
  }

  @Post(':id/chapters')
  createChapter(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseIdPipe) subjectId: string,
    @Body(new ZodValidationPipe(createChapterSchema)) body: CreateChapterInput,
  ): Promise<ChapterDto> {
    return this.curriculum.createChapter(user.organizationId, subjectId, body);
  }
}
