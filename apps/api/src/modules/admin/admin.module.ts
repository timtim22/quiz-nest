import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';

/** Admin-only screens: users, approvals, system stats, settings and the audit log (QN-3). */
@Module({
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
