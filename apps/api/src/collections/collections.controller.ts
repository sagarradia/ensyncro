import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
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
import { CollectionsService } from './collections.service';
import { UpsertCollectionItemDto } from './dto/collection-item.dto';

/** Vercel rejects request bodies over ~4.5MB at the edge, so cap CMS image
 * uploads comfortably below that. Marketing images should be small anyway. */
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/**
 * Admin management of the homepage content collections (sample listings, match
 * preview, team, testimonials, blog, achievements). One controller serves every
 * collection generically, keyed by slug. Gated to admins with the Ops sub-role
 * (Super implicit), matching the rest of the CMS.
 */
@Controller('admin/collections')
@UseGuards(JwtAuthGuard, RolesGuard, AdminRolesGuard)
@Roles(Role.ADMIN)
@AdminRoles(AdminRole.OPS)
export class CollectionsAdminController {
  constructor(private readonly collections: CollectionsService) {}

  /** The specs that drive the generic admin editor. */
  @Get('specs')
  specs() {
    return this.collections.specs();
  }

  // Static segments (image, item/…) MUST be declared before the ':slug'
  // wildcards, or a POST /image would be routed to create() with slug="image".
  @Post('image')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES } }))
  uploadImage(@UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) throw new BadRequestException('Attach an image file');
    return this.collections.uploadImage(file);
  }

  @Put('item/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpsertCollectionItemDto) {
    return this.collections.update(id, dto);
  }

  @Delete('item/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.collections.remove(id);
  }

  @Get(':slug')
  list(@Param('slug') slug: string) {
    return this.collections.list(slug);
  }

  @Post(':slug')
  create(
    @Param('slug') slug: string,
    @Body() dto: UpsertCollectionItemDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.collections.create(slug, dto, user.sub);
  }
}

/**
 * Public, world-readable collection content for the homepage, the blog and the
 * media (image) route. Unauthenticated on purpose — this is the marketing site.
 */
@Controller()
export class CollectionsPublicController {
  constructor(private readonly collections: CollectionsService) {}

  @Get('config/collections')
  homepage() {
    return this.collections.homepageContent();
  }

  @Get('config/blog')
  blogList() {
    return this.collections.blogList();
  }

  @Get('config/blog/:id')
  blogPost(@Param('id', ParseUUIDPipe) id: string) {
    return this.collections.blogPost(id);
  }

  /** Serves an admin-uploaded marketing image (redirect to S3 or streamed). */
  @Get('cms/media/:id')
  async media(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const result = await this.collections.serveImage(id);
    if ('redirect' in result) {
      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.redirect(302, result.redirect);
    }
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('Content-Disposition', `inline; filename="${result.fileName.replace(/"/g, '')}"`);
    return res.end(result.buffer);
  }
}
