import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaService } from '../prisma/prisma.service';

/** Presigned links are deliberately short-lived. */
export const PRESIGN_TTL_SECONDS = 60;

/**
 * Byte storage for uploaded files.
 *
 * Everything above this interface (permissions, access tokens, audit logging)
 * is storage-agnostic. `presign` returns a direct download URL when the backend
 * supports it, letting the API redirect instead of proxying bytes — essential
 * for large media, since a serverless function should never stream a 200MB
 * video. Backends without presigning return null and the API streams instead.
 */
export abstract class FileStorage {
  abstract put(fileId: string, content: Buffer, contentType?: string): Promise<void>;
  abstract get(fileId: string): Promise<Buffer | null>;
  abstract remove(fileId: string): Promise<void>;
  abstract presign(fileId: string, fileName: string, contentType?: string | null): Promise<string | null>;
  abstract readonly kind: 'postgres' | 's3';
}

/** Interim/local backend. Fine for documents, not for video. */
@Injectable()
export class PostgresFileStorage extends FileStorage {
  readonly kind = 'postgres' as const;

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

  /** No presigning — the API streams these. */
  async presign(): Promise<string | null> {
    return null;
  }
}

@Injectable()
export class S3FileStorage extends FileStorage {
  readonly kind = 's3' as const;
  private readonly logger = new Logger(S3FileStorage.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    super();
    this.bucket = this.config.get<string>('s3.bucket')!;
    this.client = new S3Client({
      region: this.config.get<string>('s3.region'),
      credentials: {
        accessKeyId: this.config.get<string>('s3.accessKeyId')!,
        secretAccessKey: this.config.get<string>('s3.secretAccessKey')!,
      },
    });
  }

  /** Objects are namespaced but the key is never guessable from outside. */
  private key(fileId: string): string {
    return `uploads/${fileId}`;
  }

  async put(fileId: string, content: Buffer, contentType?: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.key(fileId),
        Body: content,
        ContentType: contentType ?? 'application/octet-stream',
      }),
    );
  }

  async get(fileId: string): Promise<Buffer | null> {
    try {
      const res = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: this.key(fileId) }),
      );
      const bytes = await res.Body?.transformToByteArray();
      return bytes ? Buffer.from(bytes) : null;
    } catch (e) {
      this.logger.warn(`S3 get failed for ${fileId}: ${(e as Error).message}`);
      return null;
    }
  }

  async remove(fileId: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: this.key(fileId) }),
    );
  }

  /**
   * Short-lived presigned GET. Only ever handed out after the caller has been
   * authorised and the view recorded — the bucket itself stays private.
   */
  async presign(fileId: string, fileName: string, contentType?: string | null): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: this.key(fileId),
        ResponseContentDisposition: `inline; filename="${fileName.replace(/"/g, '')}"`,
        ...(contentType ? { ResponseContentType: contentType } : {}),
      }),
      { expiresIn: PRESIGN_TTL_SECONDS },
    );
  }
}
