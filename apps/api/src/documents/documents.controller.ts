import { Controller, Get, Param, ParseUUIDPipe, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AccessTokenPayload } from '../auth/tokens/token.service';
import { FounderDocumentsService, GeneratedDoc } from './founder-documents.service';

/**
 * Auto-generated Teaser and Information Memorandum downloads (PRD v2 §3, §7).
 * Both are built on demand from the founder's live structured data, so they can
 * never be stale, and both honour the same gating as the profile: an investor
 * only gets the gated commercial sections inside the IM if the founder has
 * shared them, and every such inclusion is audited by the underlying service.
 */
@Controller('founders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.FOUNDER, Role.INVESTOR, Role.ADMIN)
export class DocumentsController {
  constructor(private readonly docs: FounderDocumentsService) {}

  @Get(':userId/teaser.pdf')
  async teaser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() viewer: AccessTokenPayload,
    @Res() res: Response,
  ) {
    this.send(res, await this.docs.teaser(userId, viewer));
  }

  @Get(':userId/im.pdf')
  async im(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() viewer: AccessTokenPayload,
    @Res() res: Response,
  ) {
    this.send(res, await this.docs.informationMemorandum(userId, viewer));
  }

  private send(res: Response, doc: GeneratedDoc) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${doc.filename}"`);
    res.setHeader('Content-Length', doc.buffer.length);
    // Regenerated every request — never serve a cached copy.
    res.setHeader('Cache-Control', 'no-store');
    res.end(doc.buffer);
  }
}
