import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  createChapterSchema,
  createSubjectSchema,
  updateSubjectSchema,
  type CreateChapterInput,
  type CreateSubjectInput,
  type UpdateSubjectInput,
} from '@quiz-nest/shared';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurriculumService } from './curriculum.service';

@Controller('subjects')
@UseGuards(JwtAuthGuard)
export class SubjectsController {
  constructor(private readonly curriculum: CurriculumService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.curriculum.listSubjects(user.id);
  }

  @Get(':id')
  get(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.curriculum.getSubject(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: { id: string },
    @Body(new ZodValidationPipe(createSubjectSchema)) body: CreateSubjectInput,
  ) {
    return this.curriculum.createSubject(user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateSubjectSchema)) body: UpdateSubjectInput,
  ) {
    return this.curriculum.updateSubject(user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    await this.curriculum.deleteSubject(user.id, id);
  }

  // Chapters are created under a subject
  @Post(':subjectId/chapters')
  createChapter(
    @CurrentUser() user: { id: string },
    @Param('subjectId') subjectId: string,
    @Body(new ZodValidationPipe(createChapterSchema)) body: CreateChapterInput,
  ) {
    return this.curriculum.createChapter(user.id, subjectId, body);
  }
}
