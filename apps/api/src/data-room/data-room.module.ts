import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma/prisma.service';
import { DataRoomController } from './data-room.controller';
import { DataRoomService } from './data-room.service';
import { FileStorage, PostgresFileStorage, S3FileStorage } from './storage.service';

/**
 * Picks the storage backend from configuration: S3 when fully configured
 * (production), otherwise the Postgres blob store so local development and
 * tests work without AWS credentials.
 */
const storageProvider = {
  provide: FileStorage,
  inject: [ConfigService, PrismaService],
  useFactory: (config: ConfigService, prisma: PrismaService): FileStorage => {
    const s3 = config.get<Record<string, string>>('s3');
    const logger = new Logger('FileStorage');
    const hasCredentials = Boolean(s3?.bucket && s3?.accessKeyId && s3?.secretAccessKey);

    if (hasCredentials && s3?.region) {
      logger.log(`Using S3 storage (bucket ${s3.bucket}, region ${s3.region})`);
      return new S3FileStorage(config);
    }
    if (hasCredentials) {
      // Credentials are present, so S3 was clearly intended. Say exactly what is
      // wrong rather than quietly writing production uploads into Postgres.
      logger.error(
        `AWS_REGION is not a valid region code (got "${s3?.rawRegion ?? ''}") — expected e.g. ` +
          'ap-southeast-2. Falling back to Postgres blob storage.',
      );
    } else {
      logger.warn('AWS S3 not configured — falling back to Postgres blob storage');
    }
    return new PostgresFileStorage(prisma);
  },
};

@Module({
  imports: [AuthModule, JwtModule.register({})],
  controllers: [DataRoomController],
  providers: [DataRoomService, storageProvider],
  exports: [FileStorage],
})
export class DataRoomModule {}
