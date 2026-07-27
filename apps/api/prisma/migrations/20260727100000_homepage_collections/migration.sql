-- CreateEnum
CREATE TYPE "CollectionKind" AS ENUM ('SAMPLE_LISTING', 'MATCH_PREVIEW', 'TEAM', 'TESTIMONIAL', 'BLOG', 'ACHIEVEMENT');

-- CreateTable
CREATE TABLE "cms_images" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_items" (
    "id" TEXT NOT NULL,
    "collection" "CollectionKind" NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "body" TEXT,
    "linkUrl" TEXT,
    "matchPct" INTEGER,
    "sector" TEXT,
    "date" TIMESTAMP(3),
    "imageId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "collection_items_collection_published_idx" ON "collection_items"("collection", "published");

-- AddForeignKey
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "cms_images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

