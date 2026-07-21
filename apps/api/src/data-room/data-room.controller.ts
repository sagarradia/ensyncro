import {
  Body,
  Controller,
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
import { DataRoomVisibility, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AccessTokenPayload } from '../auth/tokens/token.service';
import { DataRoomService, MAX_FILE_BYTES } from './data-room.service';
import { SetVisibilityDto } from './dto/set-visibility.dto';

@Controller('data-room')
export class DataRoomController {
  constructor(private readonly dataRoom: DataRoomService) {}

  /** Founders upload to their own data room (deck, cap table, financials). */
  @Post('files')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FOUNDER)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_BYTES } }))
  upload(
    @CurrentUser() user: AccessTokenPayload,
    @UploadedFile() file: Express.Multer.File,
    @Body('visibility') visibility?: DataRoomVisibility,
  ) {
    return this.dataRoom.upload(user, file, visibility ?? DataRoomVisibility.PRIVATE);
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
    const { file, content } = await this.dataRoom.readSigned(id, token);
    res.setHeader('Content-Type', file.contentType ?? 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);
    // Never let a proxy or browser cache private material.
    res.setHeader('Cache-Control', 'no-store, private');
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
