-- CreateEnum
CREATE TYPE "VideoProvider" AS ENUM ('YOUTUBE', 'VIMEO', 'LOOM');

-- CreateEnum
CREATE TYPE "ProfileSection" AS ENUM ('FINANCIALS', 'FUNDING_HISTORY');

-- AlterTable
ALTER TABLE "founder_profiles" ADD COLUMN     "arr" INTEGER,
ADD COLUMN     "categories" TEXT[],
ADD COLUMN     "financialsVisibility" "DataRoomVisibility" NOT NULL DEFAULT 'PRIVATE',
ADD COLUMN     "fundingHistoryVisibility" "DataRoomVisibility" NOT NULL DEFAULT 'PRIVATE',
ADD COLUMN     "logoFileId" TEXT,
ADD COLUMN     "monthlyBurn" INTEGER,
ADD COLUMN     "mrr" INTEGER,
ADD COLUMN     "pitchVideoFileId" TEXT,
ADD COLUMN     "pitchVideoId" TEXT,
ADD COLUMN     "pitchVideoProvider" "VideoProvider",
ADD COLUMN     "productDescription" TEXT,
ADD COLUMN     "productName" TEXT,
ADD COLUMN     "runwayMonths" INTEGER,
ADD COLUMN     "tagline" TEXT,
ADD COLUMN     "useOfFunds" TEXT;

-- CreateTable
CREATE TABLE "founder_milestones" (
    "id" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "occurredOn" TIMESTAMP(3) NOT NULL,
    "achieved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "founder_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funding_rounds" (
    "id" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "stage" "FundingStage" NOT NULL,
    "amountRaised" INTEGER NOT NULL,
    "preMoney" INTEGER,
    "postMoney" INTEGER,
    "closedOn" TIMESTAMP(3) NOT NULL,
    "leadInvestor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funding_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_section_access_log" (
    "id" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "section" "ProfileSection" NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_section_access_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "founder_milestones_founderId_idx" ON "founder_milestones"("founderId");

-- CreateIndex
CREATE INDEX "funding_rounds_founderId_idx" ON "funding_rounds"("founderId");

-- CreateIndex
CREATE INDEX "profile_section_access_log_founderId_idx" ON "profile_section_access_log"("founderId");

-- CreateIndex
CREATE INDEX "profile_section_access_log_viewerId_idx" ON "profile_section_access_log"("viewerId");

-- CreateIndex
CREATE UNIQUE INDEX "founder_profiles_pitchVideoFileId_key" ON "founder_profiles"("pitchVideoFileId");

-- CreateIndex
CREATE UNIQUE INDEX "founder_profiles_logoFileId_key" ON "founder_profiles"("logoFileId");

-- AddForeignKey
ALTER TABLE "founder_profiles" ADD CONSTRAINT "founder_profiles_pitchVideoFileId_fkey" FOREIGN KEY ("pitchVideoFileId") REFERENCES "data_room_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "founder_profiles" ADD CONSTRAINT "founder_profiles_logoFileId_fkey" FOREIGN KEY ("logoFileId") REFERENCES "data_room_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "founder_milestones" ADD CONSTRAINT "founder_milestones_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "founder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funding_rounds" ADD CONSTRAINT "funding_rounds_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "founder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_section_access_log" ADD CONSTRAINT "profile_section_access_log_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_section_access_log" ADD CONSTRAINT "profile_section_access_log_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

