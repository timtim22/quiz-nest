import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  createStudentSchema,
  listStudentsQuerySchema,
  updateStudentSchema,
} from '@quiz-nest/shared';
import { StudentsService, type Actor } from './students.service.js';
import { parseWith } from './students.validation.js';

// STEP 2 (below): paste your login-guard import here

/**
 * Reads the logged-in user from the request.
 * If nobody is logged in, this throws 401, so the routes are safe even before Step 2.
 */
function actorOf(req: { user?: unknown }): Actor {
  const user = req.user as Partial<Actor> | undefined;
  if (!user?.id || !user.organizationId) throw new UnauthorizedException();
  return { id: user.id, organizationId: user.organizationId };
}

// STEP 2 (below): paste your @UseGuards(...) line here
@Controller('students')
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  @Get()
  list(@Req() req: { user?: unknown }, @Query() query: Record<string, unknown>) {
    return this.students.list(actorOf(req), parseWith(listStudentsQuerySchema, query));
  }

  @Post()
  create(@Req() req: { user?: unknown }, @Body() body: unknown) {
    return this.students.create(actorOf(req), parseWith(createStudentSchema, body));
  }

  // Declared before the ":id" routes so "import" is never read as an id.
  @Post('import')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 1024 * 1024 } })) // 1 MB
  importCsv(@Req() req: { user?: unknown }, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Attach a CSV file in the "file" field.');
    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      throw new BadRequestException('Only .csv files are supported.');
    }
    return this.students.importCsv(actorOf(req), file.buffer);
  }

  @Get(':id')
  findOne(@Req() req: { user?: unknown }, @Param('id', ParseUUIDPipe) id: string) {
    return this.students.findOne(actorOf(req), id);
  }

  @Patch(':id')
  update(
    @Req() req: { user?: unknown },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    return this.students.update(actorOf(req), id, parseWith(updateStudentSchema, body));
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Req() req: { user?: unknown }, @Param('id', ParseUUIDPipe) id: string) {
    await this.students.remove(actorOf(req), id);
  }
}
