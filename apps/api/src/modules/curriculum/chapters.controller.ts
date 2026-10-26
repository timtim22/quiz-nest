import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common';
import {
  type ChapterDto,
  type CreateTopicInput,
  createTopicSchema,
  type TopicDto,
  type UpdateChapterInput,
  updateChapterSchema,
} from '@quiz-nest/shared';
import { ParseIdPipe } from '../../common/pipes/parse-id.pipe.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import type { RequestUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/decorators.js';
import { CurriculumService } from './curriculum.service.js';

@Controller('chapters')
export class ChaptersController {
  constructor(private readonly curriculum: CurriculumService) {}

  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseIdPipe) id: string,
    @Body(new ZodValidationPipe(updateChapterSchema)) body: UpdateChapterInput,
  ): Promise<ChapterDto> {
    return this.curriculum.updateChapter(user.organizationId, id, body);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseIdPipe) id: string,
  ): Promise<null> {
    await this.curriculum.deleteChapter(user.organizationId, id);
    return null;
  }

  @Post(':id/topics')
  createTopic(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseIdPipe) chapterId: string,
    @Body(new ZodValidationPipe(createTopicSchema)) body: CreateTopicInput,
  ): Promise<TopicDto> {
    return this.curriculum.createTopic(user.organizationId, chapterId, body);
  }
}
