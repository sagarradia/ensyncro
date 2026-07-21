import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { DataRoomVisibility, MediaKind, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AccessTokenPayload } from '../auth/tokens/token.service';
import { DataRoomService, MAX_FILE_BYTES } from './data-room.service';
import { SetVisibilityDto } from './dto/set-visibility.dto';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';

@Controller('data-room')
export class DataRoomController {
  constructor(private readonly dataRoom: DataRoomService) {}

  /**
   * Preferred upload path. Returns a URL the browser PUTs bytes to directly,
   * because the platform rejects request bodies over ~4.5MB before they ever
   * reach this function — so anything larger cannot be posted here at all.
   * Falls back to `{ mode: 'multipart' }` when storage cannot presign.
   */
  @Post('files/upload-url')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FOUNDER)
  createUploadUrl(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreateUploadUrlDto) {
    return this.dataRoom.createUploadUrl(user, dto);
  }

  /** Confirms the bytes arrived; the file is unusable until this succeeds. */
  @Post('files/:id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FOUNDER)
  completeUpload(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.dataRoom.completeUpload(id, user);
  }

  /** Storage used against the per-founder quota. */
  @Get('usage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FOUNDER)
  usage(@CurrentUser() user: AccessTokenPayload) {
    return this.dataRoom.usage(user.sub);
  }

  /**
   * Multipart upload, kept for the Postgres fallback (local development) and
   * small files. Subject to the same platform body limit noted above.
   */
  @Post('files')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FOUNDER)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_BYTES } }))
  upload(
    @CurrentUser() user: AccessTokenPayload,
    @UploadedFile() file: Express.Multer.File,
    @Body('visibility') visibility?: DataRoomVisibility,
    @Body('kind') kind?: MediaKind,
  ) {
    return this.dataRoom.upload(
      user,
      file,
      visibility ?? DataRoomVisibility.PRIVATE,
      kind ?? MediaKind.DOCUMENT,
    );
  }

  @Delete('files/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FOUNDER)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AccessTokenPayload) {
    return this.dataRoom.remove(id, user);
  }

  @Get('files')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FOUNDER)
  list(@CurrentUser() user: AccessTokenPayload) {
    return this.dataRoom.listOwn(user);
  }

  @Patch('files/:id/visibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FOUNDER)
  setVisibility(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: SetVisibilityDto,
  ) {
    return this.dataRoom.setVisibility(id, user, dto.visibility);
  }

  /**
   * Step 1 of access: authenticated + authorised request that returns a
   * short-lived signed link. Owners, admins, and (for VISIBLE_TO_INVESTORS
   * files) investors.
   */
  @Post('files/:id/access')
  @UseGuards(JwtAuthGuard)
  requestAccess(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AccessTokenPayload) {
    return this.dataRoom.createSignedLink(id, user);
  }

  /**
   * Step 2: the signed link itself. Deliberately NOT behind JwtAuthGuard — the
   * signed token is the credential, and it is verified, re-authorised and
   * audited inside the service. There is no unauthenticated path to bytes.
   */
  @Get('files/:id/content')
  async content(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    const { file, content, redirectUrl } = await this.dataRoom.readSigned(id, token);
    // Never let a proxy or browser cache private material.
    res.setHeader('Cache-Control', 'no-store, private');

    if (redirectUrl) {
      // Bytes come straight from private object storage via a short-lived
      // presigned URL; the access check and audit already happened above.
      res.redirect(302, redirectUrl);
      return;
    }

    res.setHeader('Content-Type', file.contentType ?? 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);
    res.send(content);
  }

  /** Task #13 — founders see who has viewed their data room. */
  @Get('access-log')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FOUNDER)
  accessLog(@CurrentUser() user: AccessTokenPayload) {
    return this.dataRoom.accessLog(user);
  }
}
