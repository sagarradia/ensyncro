import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CmsAdminController, CmsPublicController } from './cms.controller';
import { CmsService } from './cms.service';

/**
 * Admin CMS: editable homepage copy, pricing tiers and the success-fee setting,
 * plus the public content feed the homepage reads (PRD §6).
 */
@Module({
  imports: [AuthModule],
  controllers: [CmsAdminController, CmsPublicController],
  providers: [CmsService],
})
export class CmsModule {}
