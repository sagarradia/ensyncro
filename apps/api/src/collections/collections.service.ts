import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CollectionItem, CollectionKind, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FileStorage } from '../data-room/storage.service';
import { COLLECTION_SPECS, CollectionSpec, SPEC_BY_SLUG } from './collection-specs';
import { UpsertCollectionItemDto } from './dto/collection-item.dto';

/** How many blog posts the homepage teaser shows. */
const BLOG_TEASER_COUNT = 3;
/** Presigned marketing-image links can be long-lived; they are public assets. */
const IMAGE_TTL_SECONDS = 60 * 60;

@Injectable()
export class CollectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: FileStorage,
  ) {}

  private specOrThrow(slug: string): CollectionSpec {
    const spec = SPEC_BY_SLUG.get(slug);
    if (!spec) throw new NotFoundException('Unknown collection');
    return spec;
  }

  /** The specs, for the admin editor to render every collection generically. */
  specs() {
    return { specs: COLLECTION_SPECS };
  }

  // ── Admin CRUD ─────────────────────────────────────────────────

  async list(slug: string) {
    const spec = this.specOrThrow(slug);
    const items = await this.prisma.collectionItem.findMany({
      where: { collection: spec.kind },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return { spec, items: items.map((i) => this.adminShape(i)) };
  }

  /** Keeps only the columns the target collection actually uses, so a stray
   * field from the generic form can never land on the wrong collection. */
  private dataFor(spec: CollectionSpec, dto: UpsertCollectionItemDto): Prisma.CollectionItemUncheckedCreateInput {
    const uses = new Set(spec.fields.map((f) => f.name));
    const data: Prisma.CollectionItemUncheckedCreateInput = {
      collection: spec.kind,
      title: dto.title,
    };
    if (uses.has('subtitle')) data.subtitle = dto.subtitle?.trim() || null;
    if (uses.has('body')) data.body = dto.body ?? null;
    if (uses.has('linkUrl')) data.linkUrl = this.cleanUrl(dto.linkUrl);
    if (uses.has('sector')) data.sector = dto.sector?.trim() || null;
    if (uses.has('matchPct')) data.matchPct = dto.matchPct ?? null;
    if (uses.has('date')) data.date = dto.date ? new Date(dto.date) : null;
    if (spec.image) data.imageId = dto.imageId || null;
    data.sortOrder = dto.sortOrder ?? 0;
    data.published = dto.published ?? true;
    return data;
  }

  async create(slug: string, dto: UpsertCollectionItemDto, userId: string) {
    const spec = this.specOrThrow(slug);
    if (spec.image && dto.imageId) await this.assertImage(dto.imageId);
    const item = await this.prisma.collectionItem.create({
      data: { ...this.dataFor(spec, dto), createdById: userId },
    });
    return this.adminShape(item);
  }

  async update(id: string, dto: UpsertCollectionItemDto) {
    const existing = await this.prisma.collectionItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Not found');
    const spec = COLLECTION_SPECS.find((s) => s.kind === existing.collection)!;
    if (spec.image && dto.imageId) await this.assertImage(dto.imageId);
    const { collection: _c, title, ...rest } = this.dataFor(spec, dto);
    const item = await this.prisma.collectionItem.update({
      where: { id },
      data: { title, ...rest },
    });
    return this.adminShape(item);
  }

  async remove(id: string) {
    const { count } = await this.prisma.collectionItem.deleteMany({ where: { id } });
    if (!count) throw new NotFoundException('Not found');
    return { id, deleted: true };
  }

  // ── Images ─────────────────────────────────────────────────────

  private async assertImage(id: string) {
    const img = await this.prisma.cmsImage.findUnique({ where: { id }, select: { id: true } });
    if (!img) throw new BadRequestException('That image does not exist');
  }

  async uploadImage(file: { buffer: Buffer; originalname: string; mimetype: string; size: number }) {
    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Upload an image file (PNG, JPG, WebP…)');
    }
    const img = await this.prisma.cmsImage.create({
      data: {
        fileName: file.originalname?.slice(0, 200) || 'image',
        contentType: file.mimetype,
        sizeBytes: file.size,
      },
    });
    await this.storage.put(img.id, file.buffer, file.mimetype);
    return { id: img.id, url: this.imagePath(img.id) };
  }

  /** Resolves an image to a redirect URL (S3) or streams it (Postgres). */
  async serveImage(id: string): Promise<{ redirect: string } | { buffer: Buffer; contentType: string; fileName: string }> {
    const img = await this.prisma.cmsImage.findUnique({ where: { id } });
    if (!img) throw new NotFoundException('Not found');
    const presigned = await this.storage.presign(img.id, img.fileName, img.contentType, IMAGE_TTL_SECONDS);
    if (presigned) return { redirect: presigned };
    const buffer = await this.storage.get(img.id);
    if (!buffer) throw new NotFoundException('Not found');
    return { buffer, contentType: img.contentType, fileName: img.fileName };
  }

  private imagePath(id: string) {
    return `/cms/media/${id}`;
  }

  // ── Public homepage payload ────────────────────────────────────

  async homepageContent() {
    const kinds: CollectionKind[] = [
      CollectionKind.SAMPLE_LISTING,
      CollectionKind.MATCH_PREVIEW,
      CollectionKind.TEAM,
      CollectionKind.TESTIMONIAL,
      CollectionKind.ACHIEVEMENT,
    ];
    const [rows, blog] = await Promise.all([
      this.prisma.collectionItem.findMany({
        where: { collection: { in: kinds }, published: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.collectionItem.findMany({
        where: { collection: CollectionKind.BLOG, published: true },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        take: BLOG_TEASER_COUNT,
      }),
    ]);
    const of = (k: CollectionKind) => rows.filter((r) => r.collection === k);
    const matches = of(CollectionKind.MATCH_PREVIEW);
    return {
      sampleListings: of(CollectionKind.SAMPLE_LISTING).map((i) => this.publicShape(i)),
      matchPreview: matches.length ? this.publicShape(matches[0]) : null,
      team: of(CollectionKind.TEAM).map((i) => this.publicShape(i)),
      testimonials: of(CollectionKind.TESTIMONIAL).map((i) => this.publicShape(i)),
      achievements: of(CollectionKind.ACHIEVEMENT).map((i) => this.publicShape(i)),
      blog: blog.map((i) => this.blogShape(i, true)),
    };
  }

  async blogList() {
    const posts = await this.prisma.collectionItem.findMany({
      where: { collection: CollectionKind.BLOG, published: true },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return { posts: posts.map((p) => this.blogShape(p, true)) };
  }

  async blogPost(id: string) {
    const post = await this.prisma.collectionItem.findFirst({
      where: { id, collection: CollectionKind.BLOG, published: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    return this.blogShape(post, false);
  }

  // ── Shapes ─────────────────────────────────────────────────────

  private adminShape(i: CollectionItem) {
    return {
      id: i.id,
      title: i.title,
      subtitle: i.subtitle,
      body: i.body,
      linkUrl: i.linkUrl,
      sector: i.sector,
      matchPct: i.matchPct,
      date: i.date ? i.date.toISOString().slice(0, 10) : null,
      imageId: i.imageId,
      imageUrl: i.imageId ? this.imagePath(i.imageId) : null,
      sortOrder: i.sortOrder,
      published: i.published,
    };
  }

  private publicShape(i: CollectionItem) {
    return {
      id: i.id,
      title: i.title,
      subtitle: i.subtitle,
      body: i.body,
      linkUrl: i.linkUrl,
      sector: i.sector,
      matchPct: i.matchPct,
      imageUrl: i.imageId ? this.imagePath(i.imageId) : null,
    };
  }

  private blogShape(i: CollectionItem, teaser: boolean) {
    const body = i.body ?? '';
    return {
      id: i.id,
      title: i.title,
      date: i.date ? i.date.toISOString() : null,
      imageUrl: i.imageId ? this.imagePath(i.imageId) : null,
      ...(teaser ? { excerpt: this.excerpt(body) } : { body }),
    };
  }

  private excerpt(body: string): string {
    const flat = body.replace(/\s+/g, ' ').trim();
    return flat.length > 160 ? `${flat.slice(0, 160)}…` : flat;
  }

  private cleanUrl(url?: string): string | null {
    const u = url?.trim();
    if (!u) return null;
    // Only allow http(s) or same-site relative links — never javascript:/data:.
    if (/^https?:\/\//i.test(u) || u.startsWith('/')) return u;
    return `https://${u}`;
  }
}
