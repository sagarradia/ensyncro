import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Put,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AdminRole, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminRolesGuard } from '../auth/guards/admin-roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminRoles } from '../auth/decorators/admin-roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AccessTokenPayload } from '../auth/tokens/token.service';
import { CmsService } from './cms.service';
import { UpdateCmsDto } from './dto/update-cms.dto';

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // an admin content workbook is tiny

/**
 * Admin CMS (original Day 3 scope). Site marketing content, pricing tiers and
 * the admin-configurable success fee (PRD §2 / §6). Gated to admins with the
 * Ops or Finance sub-role (Super satisfies both) — Ops owns marketing/pricing,
 * Finance owns the success fee; both live on one page so the whole surface
 * shares one gate.
 */
@Controller('admin/cms')
@UseGuards(JwtAuthGuard, RolesGuard, AdminRolesGuard)
@Roles(Role.ADMIN)
@AdminRoles(AdminRole.OPS, AdminRole.FINANCE)
export class CmsAdminController {
  constructor(private readonly cms: CmsService) {}

  /** Every editable field with metadata + current value, grouped for the form. */
  @Get()
  content() {
    return this.cms.adminContent();
  }

  /** Save one or more field edits. */
  @Put()
  save(@CurrentUser() user: AccessTokenPayload, @Body() dto: UpdateCmsDto) {
    return this.cms.saveMany(dto.updates, user.sub);
  }

  /** Bulk update from an uploaded .xlsx matching the template. */
  @Post('bulk')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }))
  bulk(
    @CurrentUser() user: AccessTokenPayload,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) throw new BadRequestException('Attach an .xlsx file');
    return this.cms.bulkUpload(file.buffer, user.sub);
  }

  /** Download a prefilled template (current values) to edit and re-upload. */
  @Get('template')
  async template(@Res() res: Response) {
    const buf = await this.cms.templateWorkbook();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="ensyncro-cms-template.xlsx"');
    res.setHeader('Content-Length', buf.length);
    res.setHeader('Cache-Control', 'no-store');
    res.end(buf);
  }
}

/**
 * Public, world-readable site content the homepage renders from. Unauthenticated
 * on purpose — the marketing homepage must load it before anyone signs in.
 */
@Controller('config')
export class CmsPublicController {
  constructor(private readonly cms: CmsService) {}

  @Get('content')
  content() {
    return this.cms.publicContent();
  }
}
