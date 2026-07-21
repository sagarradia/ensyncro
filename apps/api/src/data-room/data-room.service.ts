import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DataRoomVisibility, Role } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { FileStorage } from './storage.service';
import { AccessTokenPayload } from '../auth/tokens/token.service';

/** Hard cap — Postgres bytea is not the place for large media. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

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

  async upload(
    owner: AccessTokenPayload,
    file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    visibility: DataRoomVisibility,
  ) {
    if (!file?.buffer?.length) throw new BadRequestException('File is empty');
    if (file.size > MAX_FILE_BYTES) {
      throw new BadRequestException(`File exceeds the ${MAX_FILE_BYTES / 1024 / 1024}MB limit`);
    }

    const record = await this.prisma.dataRoomFile.create({
      data: {
        ownerId: owner.sub,
        // Opaque key — never part of a public URL, just an identifier.
        fileKey: `dr_${randomBytes(16).toString('hex')}`,
        fileName: file.originalname,
        contentType: file.mimetype,
        sizeBytes: file.size,
        visibility,
      },
      select: {
        id: true,
        fileName: true,
        contentType: true,
        sizeBytes: true,
        visibility: true,
        uploadedAt: true,
      },
    });

    await this.storage.put(record.id, file.buffer);
    return record;
  }

  listOwn(owner: AccessTokenPayload) {
    return this.prisma.dataRoomFile.findMany({
      where: { ownerId: owner.sub },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        contentType: true,
        sizeBytes: true,
        visibility: true,
        uploadedAt: true,
        _count: { select: { accessLogs: true } },
      },
    });
  }

  /**
   * Central authorisation decision for a single file. Every path that can
   * surface bytes goes through here.
   */
  private async authorise(fileId: string, user: AccessTokenPayload) {
    const file = await this.prisma.dataRoomFile.findUnique({
      where: { id: fileId },
      select: { id: true, ownerId: true, fileName: true, contentType: true, visibility: true },
    });
    // Same response whether it is missing or not yours, so the endpoint cannot
    // be used to probe which file ids exist.
    if (!file) throw new NotFoundException('File not found');

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

    const content = await this.storage.get(file.id);
    if (!content) throw new NotFoundException('File contents missing');

    // Task #13 — audit every actual view.
    await this.prisma.dataRoomAccessLog.create({
      data: { fileId: file.id, viewerId: viewer.id },
    });

    return { file, content };
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
