import { Module } from '@nestjs/common';
import { ChaptersController } from './chapters.controller.js';
import { CurriculumService } from './curriculum.service.js';
import { SubjectsController } from './subjects.controller.js';
import { TopicsController } from './topics.controller.js';

/** Subjects → chapters → topics (QN-4). */
@Module({
  controllers: [SubjectsController, ChaptersController, TopicsController],
  providers: [CurriculumService],
  exports: [CurriculumService],
})
export class CurriculumModule {}
