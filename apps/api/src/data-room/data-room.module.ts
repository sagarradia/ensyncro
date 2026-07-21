import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { DataRoomController } from './data-room.controller';
import { DataRoomService } from './data-room.service';
import { FileStorage, PostgresFileStorage } from './storage.service';

@Module({
  imports: [AuthModule, JwtModule.register({})],
  controllers: [DataRoomController],
  providers: [
    DataRoomService,
    // Swap this provider to an S3 implementation when credentials exist —
    // nothing else in the module changes.
    { provide: FileStorage, useClass: PostgresFileStorage },
  ],
})
export class DataRoomModule {}
