import { Body, Controller, Delete, HttpCode, Param, Patch, UseGuards } from '@nestjs/common';
import { updateTopicSchema, type UpdateTopicInput } from '@quiz-nest/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurriculumService } from './curriculum.service';

@Controller('topics')
@UseGuards(JwtAuthGuard)
export class TopicsController {
  constructor(private readonly curriculum: CurriculumService) {}

  @Patch(':id')
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateTopicSchema)) body: UpdateTopicInput,
  ) {
    return this.curriculum.updateTopic(user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    await this.curriculum.deleteTopic(user.id, id);
  }
}
