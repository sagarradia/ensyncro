-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('DOCUMENT', 'PITCH_VIDEO', 'PRODUCT_IMAGE', 'LOGO');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'READY');

-- AlterTable
ALTER TABLE "data_room_files" ADD COLUMN     "kind" "MediaKind" NOT NULL DEFAULT 'DOCUMENT',
ADD COLUMN     "status" "UploadStatus" NOT NULL DEFAULT 'READY';

-- CreateIndex
CREATE INDEX "data_room_files_ownerId_kind_idx" ON "data_room_files"("ownerId", "kind");

