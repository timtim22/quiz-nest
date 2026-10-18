import { Body, Controller, Delete, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  createTopicSchema,
  updateChapterSchema,
  type CreateTopicInput,
  type UpdateChapterInput,
} from '@quiz-nest/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurriculumService } from './curriculum.service';

@Controller('chapters')
@UseGuards(JwtAuthGuard)
export class ChaptersController {
  constructor(private readonly curriculum: CurriculumService) {}

  @Patch(':id')
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateChapterSchema)) body: UpdateChapterInput,
  ) {
    return this.curriculum.updateChapter(user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    await this.curriculum.deleteChapter(user.id, id);
  }

  // Topics are created under a chapter
  @Post(':chapterId/topics')
  createTopic(
    @CurrentUser() user: { id: string },
    @Param('chapterId') chapterId: string,
    @Body(new ZodValidationPipe(createTopicSchema)) body: CreateTopicInput,
  ) {
    return this.curriculum.createTopic(user.id, chapterId, body);
  }
}
