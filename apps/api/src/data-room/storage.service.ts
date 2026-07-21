import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaService } from '../prisma/prisma.service';

/** Presigned download links are deliberately short-lived. */
export const PRESIGN_TTL_SECONDS = 60;

/**
 * Uploads get a longer window than downloads: a 200MB video on a slow
 * connection needs time, and this URL only permits writing to one exact key at
 * one exact length.
 */
export const UPLOAD_PRESIGN_TTL_SECONDS = 15 * 60;

/** What the browser needs in order to send bytes straight to storage. */
export interface PresignedUpload {
  url: string;
  /** Headers the client MUST send — they are part of the signature. */
  headers: Record<string, string>;
}

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
  abstract presign(
    fileId: string,
    fileName: string,
    contentType?: string | null,
    ttlSeconds?: number,
  ): Promise<string | null>;

  /**
   * A URL the browser can PUT bytes to directly, bypassing the API entirely.
   * Required rather than merely nice: Vercel rejects request bodies over
   * ~4.5MB at the edge, so any sizeable upload cannot travel through a
   * function. Backends that cannot do this return null and the caller falls
   * back to multipart.
   */
  abstract presignUpload(
    fileId: string,
    contentType: string,
    sizeBytes: number,
  ): Promise<PresignedUpload | null>;

  /** Actual stored size, or null if the object is absent. Used to confirm an
   * upload really happened and really is the size that was declared. */
  abstract statSize(fileId: string): Promise<number | null>;

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

  /** No direct uploads either; callers fall back to multipart. */
  async presignUpload(): Promise<PresignedUpload | null> {
    return null;
  }

  async statSize(fileId: string): Promise<number | null> {
    const row = await this.prisma.dataRoomFileBlob.findUnique({
      where: { fileId },
      select: { content: true },
    });
    return row ? row.content.length : null;
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
   * Short-lived presigned PUT for one exact key. `ContentLength` and
   * `ContentType` are signed, so the URL cannot be reused to store a different
   * amount of data than was authorised — the client's request is rejected by
   * S3 if either header disagrees with the signature.
   */
  async presignUpload(
    fileId: string,
    contentType: string,
    sizeBytes: number,
  ): Promise<PresignedUpload> {
    const url = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.key(fileId),
        ContentType: contentType,
        ContentLength: sizeBytes,
      }),
      { expiresIn: UPLOAD_PRESIGN_TTL_SECONDS },
    );
    return { url, headers: { 'Content-Type': contentType } };
  }

  async statSize(fileId: string): Promise<number | null> {
    try {
      const head = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: this.key(fileId) }),
      );
      return head.ContentLength ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Short-lived presigned GET. Only ever handed out after the caller has been
   * authorised and the view recorded — the bucket itself stays private.
   */
  async presign(
    fileId: string,
    fileName: string,
    contentType?: string | null,
    ttlSeconds: number = PRESIGN_TTL_SECONDS,
  ): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: this.key(fileId),
        ResponseContentDisposition: `inline; filename="${fileName.replace(/"/g, '')}"`,
        ...(contentType ? { ResponseContentType: contentType } : {}),
      }),
      { expiresIn: ttlSeconds },
    );
  }
}
