import { Module } from '@nestjs/common';
import { ChaptersController } from './chapters.controller';
import { CurriculumService } from './curriculum.service';
import { SubjectsController } from './subjects.controller';
import { TopicsController } from './topics.controller';

// PrismaService is assumed to come from a global PrismaModule (as in the health module).
@Module({
  controllers: [SubjectsController, ChaptersController, TopicsController],
  providers: [CurriculumService],
})
export class CurriculumModule {}
