import { Body, Controller, Delete, Param, Patch } from '@nestjs/common';
import { type TopicDto, type UpdateTopicInput, updateTopicSchema } from '@quiz-nest/shared';
import { ParseIdPipe } from '../../common/pipes/parse-id.pipe.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import type { RequestUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/decorators.js';
import { CurriculumService } from './curriculum.service.js';

@Controller('topics')
export class TopicsController {
  constructor(private readonly curriculum: CurriculumService) {}

  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseIdPipe) id: string,
    @Body(new ZodValidationPipe(updateTopicSchema)) body: UpdateTopicInput,
  ): Promise<TopicDto> {
    return this.curriculum.updateTopic(user.organizationId, id, body);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseIdPipe) id: string,
  ): Promise<null> {
    await this.curriculum.deleteTopic(user.organizationId, id);
    return null;
  }
}
