import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Byte storage for data-room files.
 *
 * Everything above this interface (permissions, signed URLs, audit logging) is
 * storage-agnostic. PRD §8 specifies S3-compatible private storage; this
 * Postgres-backed implementation is the interim backend so the security model
 * can be built and tested without external credentials. Swapping to S3 means
 * providing another implementation of these three methods — nothing else moves.
 */
export abstract class FileStorage {
  abstract put(fileId: string, content: Buffer): Promise<void>;
  abstract get(fileId: string): Promise<Buffer | null>;
  abstract remove(fileId: string): Promise<void>;
}

@Injectable()
export class PostgresFileStorage extends FileStorage {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async put(fileId: string, content: Buffer): Promise<void> {
    await this.prisma.dataRoomFileBlob.upsert({
      where: { fileId },
      create: { fileId, content },
      update: { content },
    });
  }

  async get(fileId: string): Promise<Buffer | null> {
    const row = await this.prisma.dataRoomFileBlob.findUnique({
      where: { fileId },
      select: { content: true },
    });
    return row ? Buffer.from(row.content) : null;
  }

  async remove(fileId: string): Promise<void> {
    await this.prisma.dataRoomFileBlob.deleteMany({ where: { fileId } });
  }
}
