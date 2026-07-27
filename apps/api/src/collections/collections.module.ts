import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DataRoomModule } from '../data-room/data-room.module';
import { CollectionsAdminController, CollectionsPublicController } from './collections.controller';
import { CollectionsService } from './collections.service';

/**
 * Repeatable homepage marketing content (sample listings, match preview, team,
 * testimonials, blog, achievements). DataRoomModule provides FileStorage for
 * admin-uploaded images.
 */
@Module({
  imports: [AuthModule, DataRoomModule],
  controllers: [CollectionsAdminController, CollectionsPublicController],
  providers: [CollectionsService],
})
export class CollectionsModule {}
