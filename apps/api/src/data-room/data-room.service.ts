import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DataRoomVisibility, MediaKind, Role, UploadStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { FileStorage, UPLOAD_PRESIGN_TTL_SECONDS } from './storage.service';
import { AccessTokenPayload } from '../auth/tokens/token.service';

/** Per-file cap for documents. Not a per-founder quota. */
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
/** The pitch video is the one asset expected to be large. */
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export const MAX_BYTES_BY_KIND: Readonly<Record<MediaKind, number>> = {
  [MediaKind.DOCUMENT]: MAX_FILE_BYTES,
  [MediaKind.PITCH_VIDEO]: MAX_VIDEO_BYTES,
  [MediaKind.PRODUCT_IMAGE]: MAX_IMAGE_BYTES,
  [MediaKind.LOGO]: MAX_IMAGE_BYTES,
};

/** Total storage one founder may consume. */
export const FOUNDER_QUOTA_BYTES = 500 * 1024 * 1024;

/**
 * The pitch video does not count against the quota — a single 200MB video
 * would otherwise consume most of it and leave no room for documents.
 */
export const QUOTA_EXEMPT_KINDS: readonly MediaKind[] = [MediaKind.PITCH_VIDEO];

/** Keeps a kind from being used to store something it is not. */
const CONTENT_TYPE_PREFIX: Partial<Record<MediaKind, string>> = {
  [MediaKind.PITCH_VIDEO]: 'video/',
  [MediaKind.PRODUCT_IMAGE]: 'image/',
  [MediaKind.LOGO]: 'image/',
};

const asMb = (bytes: number) => Math.round(bytes / 1024 / 1024);

/** Signed download links are deliberately very short-lived. */
const SIGNED_URL_TTL_SECONDS = 60;

interface SignedFilePayload {
  fileId: string;
  sub: string;
  purpose: 'data-room-file';
}

@Injectable()
export class DataRoomService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: FileStorage,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private signingSecret(): string {
    return (
      this.config.get<string>('jwt.accessSecret') ||
      'dev-insecure-access-secret-do-not-use-in-prod'
    );
  }

  /** Storage consumed by one founder, and what is left of the quota. */
  async usage(ownerId: string) {
    const agg = await this.prisma.dataRoomFile.aggregate({
      where: {
        ownerId,
        status: UploadStatus.READY,
        kind: { notIn: [...QUOTA_EXEMPT_KINDS] },
      },
      _sum: { sizeBytes: true },
    });
    const usedBytes = agg._sum.sizeBytes ?? 0;
    return {
      usedBytes,
      quotaBytes: FOUNDER_QUOTA_BYTES,
      remainingBytes: Math.max(0, FOUNDER_QUOTA_BYTES - usedBytes),
    };
  }

  /** Shared validation for both upload paths. */
  private assertUploadAllowed(kind: MediaKind, contentType: string, sizeBytes: number) {
    if (!sizeBytes || sizeBytes <= 0) throw new BadRequestException('File is empty');

    const max = MAX_BYTES_BY_KIND[kind];
    if (sizeBytes > max) {
      throw new BadRequestException(
        `File exceeds the ${asMb(max)}MB limit for ${kind.toLowerCase().replace('_', ' ')}`,
      );
    }

    const prefix = CONTENT_TYPE_PREFIX[kind];
    if (prefix && !contentType?.startsWith(prefix)) {
      throw new BadRequestException(
        `A ${kind.toLowerCase().replace('_', ' ')} must be a ${prefix.replace('/', '')} file`,
      );
    }
  }

  private async assertQuota(ownerId: string, kind: MediaKind, sizeBytes: number) {
    if (QUOTA_EXEMPT_KINDS.includes(kind)) return;
    const { remainingBytes, quotaBytes } = await this.usage(ownerId);
    if (sizeBytes > remainingBytes) {
      throw new BadRequestException(
        `This would exceed your ${asMb(quotaBytes)}MB storage quota — ` +
          `${asMb(remainingBytes)}MB remaining. Delete something first.`,
      );
    }
  }

  /**
   * Step 1 of a direct upload: validate, reserve a row, and hand back a URL the
   * browser PUTs bytes to. The API never sees the bytes, which is what makes a
   * 200MB video possible — a serverless request body is capped far below that.
   */
  async createUploadUrl(
    owner: AccessTokenPayload,
    dto: {
      fileName: string;
      contentType: string;
      sizeBytes: number;
      kind?: MediaKind;
      visibility?: DataRoomVisibility;
    },
  ) {
    const kind = dto.kind ?? MediaKind.DOCUMENT;
    this.assertUploadAllowed(kind, dto.contentType, dto.sizeBytes);
    await this.assertQuota(owner.sub, kind, dto.sizeBytes);

    const record = await this.prisma.dataRoomFile.create({
      data: {
        ownerId: owner.sub,
        fileKey: `dr_${randomBytes(16).toString('hex')}`,
        fileName: dto.fileName,
        contentType: dto.contentType,
        sizeBytes: dto.sizeBytes,
        kind,
        visibility: dto.visibility ?? DataRoomVisibility.PRIVATE,
        // Not readable by anything until the bytes are confirmed present.
        status: UploadStatus.PENDING,
      },
      select: { id: true },
    });

    const presigned = await this.storage.presignUpload(
      record.id,
      dto.contentType,
      dto.sizeBytes,
    );
    if (!presigned) {
      // Backend cannot take direct uploads (local Postgres fallback). Drop the
      // reservation and let the client post the file to the API instead.
      await this.prisma.dataRoomFile.delete({ where: { id: record.id } });
      return { mode: 'multipart' as const };
    }

    return {
      mode: 'presigned-put' as const,
      fileId: record.id,
      uploadUrl: presigned.url,
      headers: presigned.headers,
      expiresInSeconds: UPLOAD_PRESIGN_TTL_SECONDS,
    };
  }

  /**
   * Step 2: confirm the bytes landed. The size is read back from storage rather
   * than trusted from the client, so a small declared size cannot be used to
   * smuggle a large object past the cap or the quota.
   */
  async completeUpload(fileId: string, owner: AccessTokenPayload) {
    const file = await this.prisma.dataRoomFile.findFirst({
      where: { id: fileId, ownerId: owner.sub },
    });
    if (!file) throw new NotFoundException('File not found');
    if (file.status === UploadStatus.READY) return this.summarise(file.id);

    const actualBytes = await this.storage.statSize(fileId);
    if (actualBytes === null) {
      // The upload never landed (or storage rejected it). Drop the reservation
      // rather than leaving an orphaned PENDING row behind.
      await this.prisma.dataRoomFile.delete({ where: { id: fileId } });
      throw new BadRequestException('No uploaded file found for this reservation');
    }

    const max = MAX_BYTES_BY_KIND[file.kind];
    const { remainingBytes } = await this.usage(owner.sub);
    const overQuota = !QUOTA_EXEMPT_KINDS.includes(file.kind) && actualBytes > remainingBytes;

    if (actualBytes > max || overQuota) {
      // Reject and clean up, so an oversized object cannot be left behind.
      await this.storage.remove(fileId).catch(() => undefined);
      await this.prisma.dataRoomFile.delete({ where: { id: fileId } });
      throw new BadRequestException(
        overQuota
          ? `Upload rejected: it would exceed your ${asMb(FOUNDER_QUOTA_BYTES)}MB quota`
          : `Upload rejected: ${asMb(actualBytes)}MB exceeds the ${asMb(max)}MB limit`,
      );
    }

    await this.prisma.dataRoomFile.update({
      where: { id: fileId },
      data: { status: UploadStatus.READY, sizeBytes: actualBytes },
    });
    return this.summarise(fileId);
  }

  private summarise(fileId: string) {
    return this.prisma.dataRoomFile.findUniqueOrThrow({
      where: { id: fileId },
      select: {
        id: true,
        fileName: true,
        contentType: true,
        sizeBytes: true,
        visibility: true,
        kind: true,
        uploadedAt: true,
      },
    });
  }

  async upload(
    owner: AccessTokenPayload,
    file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    visibility: DataRoomVisibility,
    kind: MediaKind = MediaKind.DOCUMENT,
  ) {
    if (!file?.buffer?.length) throw new BadRequestException('File is empty');
    this.assertUploadAllowed(kind, file.mimetype, file.size);
    await this.assertQuota(owner.sub, kind, file.size);

    const record = await this.prisma.dataRoomFile.create({
      data: {
        ownerId: owner.sub,
        // Opaque key — never part of a public URL, just an identifier.
        fileKey: `dr_${randomBytes(16).toString('hex')}`,
        fileName: file.originalname,
        contentType: file.mimetype,
        sizeBytes: file.size,
        kind,
        visibility,
      },
      select: {
        id: true,
        fileName: true,
        contentType: true,
        sizeBytes: true,
        visibility: true,
        kind: true,
        uploadedAt: true,
      },
    });

    await this.storage.put(record.id, file.buffer, file.mimetype);
    return record;
  }

  listOwn(owner: AccessTokenPayload) {
    return this.prisma.dataRoomFile.findMany({
      where: { ownerId: owner.sub, status: UploadStatus.READY },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        contentType: true,
        sizeBytes: true,
        visibility: true,
        kind: true,
        uploadedAt: true,
        _count: { select: { accessLogs: true } },
      },
    });
  }

  /** Owner-initiated delete, which is also how quota is freed. */
  async remove(fileId: string, owner: AccessTokenPayload) {
    const file = await this.prisma.dataRoomFile.findFirst({
      where: { id: fileId, ownerId: owner.sub },
      select: { id: true },
    });
    if (!file) throw new NotFoundException('File not found');

    await this.storage.remove(fileId).catch(() => undefined);
    await this.prisma.dataRoomFile.delete({ where: { id: fileId } });
    return { id: fileId, deleted: true };
  }

  /**
   * Central authorisation decision for a single file. Every path that can
   * surface bytes goes through here.
   */
  private async authorise(fileId: string, user: AccessTokenPayload) {
    const file = await this.prisma.dataRoomFile.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        ownerId: true,
        fileName: true,
        contentType: true,
        visibility: true,
        status: true,
      },
    });
    // Same response whether it is missing, still awaiting its bytes, or not
    // yours — so the endpoint cannot be used to probe which file ids exist.
    if (!file || file.status !== UploadStatus.READY) {
      throw new NotFoundException('File not found');
    }

    const isOwner = file.ownerId === user.sub;
    const isAdmin = user.role === Role.ADMIN;
    const investorMayView =
      user.role === Role.INVESTOR && file.visibility === DataRoomVisibility.VISIBLE_TO_INVESTORS;

    if (!isOwner && !isAdmin && !investorMayView) {
      throw new NotFoundException('File not found');
    }
    return file;
  }

  /** Permission check, then a short-lived signed link. Never a public URL. */
  async createSignedLink(fileId: string, user: AccessTokenPayload) {
    const file = await this.authorise(fileId, user);

    const payload: SignedFilePayload = {
      fileId: file.id,
      sub: user.sub,
      purpose: 'data-room-file',
    };
    const token = await this.jwt.signAsync(payload, {
      secret: this.signingSecret(),
      expiresIn: SIGNED_URL_TTL_SECONDS,
    });

    return {
      fileId: file.id,
      fileName: file.fileName,
      expiresInSeconds: SIGNED_URL_TTL_SECONDS,
      url: `/api/data-room/files/${file.id}/content?token=${token}`,
    };
  }

  /**
   * Validates a signed link and returns the bytes, recording the view.
   * The token is bound to both the file AND the user it was issued to, so it
   * cannot be replayed against a different file or handed to someone else.
   */
  async readSigned(fileId: string, token: string) {
    if (!token) throw new ForbiddenException('Missing signed token');

    let payload: SignedFilePayload;
    try {
      payload = await this.jwt.verifyAsync<SignedFilePayload>(token, {
        secret: this.signingSecret(),
      });
    } catch {
      throw new ForbiddenException('Invalid or expired signed link');
    }

    if (payload.purpose !== 'data-room-file' || payload.fileId !== fileId) {
      throw new ForbiddenException('Signed link does not match this file');
    }

    // Re-check authorisation at read time so a revoked/changed permission
    // takes effect even if a signed link is still within its TTL.
    const viewer = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true },
    });
    if (!viewer) throw new ForbiddenException('Unknown viewer');
    const file = await this.authorise(fileId, {
      sub: viewer.id,
      email: viewer.email,
      role: viewer.role,
    });

    // Audit BEFORE handing over any means of reading the bytes, so a view is
    // recorded whether we stream or redirect to a presigned URL (task #13).
    await this.prisma.dataRoomAccessLog.create({
      data: { fileId: file.id, viewerId: viewer.id },
    });

    // Prefer a presigned redirect: a serverless function must not proxy large
    // media, and the bucket itself stays private.
    const redirectUrl = await this.storage.presign(file.id, file.fileName, file.contentType);
    if (redirectUrl) return { file, redirectUrl, content: null };

    const content = await this.storage.get(file.id);
    if (!content) throw new NotFoundException('File contents missing');
    return { file, redirectUrl: null, content };
  }

  setVisibility(fileId: string, owner: AccessTokenPayload, visibility: DataRoomVisibility) {
    return this.prisma.dataRoomFile
      .update({
        where: { id: fileId, ownerId: owner.sub },
        data: { visibility },
        select: { id: true, fileName: true, visibility: true },
      })
      .catch(() => {
        throw new NotFoundException('File not found');
      });
  }

  /** Task #13 — who has accessed this founder's data room. */
  accessLog(owner: AccessTokenPayload) {
    return this.prisma.dataRoomAccessLog.findMany({
      where: { file: { ownerId: owner.sub } },
      orderBy: { viewedAt: 'desc' },
      take: 100,
      select: {
        id: true,
        viewedAt: true,
        file: { select: { id: true, fileName: true } },
        viewer: { select: { id: true, email: true, role: true } },
      },
    });
  }
}
