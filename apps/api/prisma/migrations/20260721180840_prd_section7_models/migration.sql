-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER', 'FINANCE', 'LEGAL', 'OPS');

-- CreateEnum
CREATE TYPE "FundingStage" AS ENUM ('IDEA', 'PRE_SEED', 'SEED', 'SERIES_A', 'SERIES_B', 'SERIES_C_PLUS');

-- CreateEnum
CREATE TYPE "InvestorType" AS ENUM ('ANGEL', 'PRE_SEED', 'SEED_VC', 'SERIES_A_PLUS_VC', 'MICRO_VC', 'SYNDICATE', 'CROWDFUNDING', 'CORPORATE_VC', 'FAMILY_OFFICE', 'ACCELERATOR_INCUBATOR', 'GOVERNMENT_INSTITUTIONAL');

-- CreateEnum
CREATE TYPE "DataRoomVisibility" AS ENUM ('PRIVATE', 'SHARED_ON_REQUEST', 'VISIBLE_TO_INVESTORS');

-- CreateEnum
CREATE TYPE "ShortlistStatus" AS ENUM ('SAVED', 'CONTACTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "IntroRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "founder_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "stage" "FundingStage" NOT NULL,
    "fundingSought" INTEGER,
    "description" TEXT,
    "website" TEXT,
    "location" TEXT,
    "teamSize" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "founder_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investor_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "investorTypes" "InvestorType"[],
    "sectors" TEXT[],
    "ticketMin" INTEGER,
    "ticketMax" INTEGER,
    "description" TEXT,
    "website" TEXT,
    "location" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adminRole" "AdminRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_invites" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "adminRole" "AdminRole" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_room_files" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT,
    "sizeBytes" INTEGER,
    "visibility" "DataRoomVisibility" NOT NULL DEFAULT 'PRIVATE',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_room_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_room_access_log" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_room_access_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_shortlist" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "status" "ShortlistStatus" NOT NULL DEFAULT 'SAVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_shortlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intro_requests" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "status" "IntroRequestStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intro_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_content" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_stats" (
    "id" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "founder_profiles_userId_key" ON "founder_profiles"("userId");

-- CreateIndex
CREATE INDEX "founder_profiles_sector_idx" ON "founder_profiles"("sector");

-- CreateIndex
CREATE INDEX "founder_profiles_stage_idx" ON "founder_profiles"("stage");

-- CreateIndex
CREATE UNIQUE INDEX "investor_profiles_userId_key" ON "investor_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_profiles_userId_key" ON "admin_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_invites_tokenHash_key" ON "admin_invites"("tokenHash");

-- CreateIndex
CREATE INDEX "admin_invites_email_idx" ON "admin_invites"("email");

-- CreateIndex
CREATE UNIQUE INDEX "data_room_files_fileKey_key" ON "data_room_files"("fileKey");

-- CreateIndex
CREATE INDEX "data_room_files_ownerId_idx" ON "data_room_files"("ownerId");

-- CreateIndex
CREATE INDEX "data_room_access_log_fileId_idx" ON "data_room_access_log"("fileId");

-- CreateIndex
CREATE INDEX "data_room_access_log_viewerId_idx" ON "data_room_access_log"("viewerId");

-- CreateIndex
CREATE INDEX "saved_shortlist_founderId_idx" ON "saved_shortlist"("founderId");

-- CreateIndex
CREATE UNIQUE INDEX "saved_shortlist_investorId_founderId_key" ON "saved_shortlist"("investorId", "founderId");

-- CreateIndex
CREATE INDEX "intro_requests_fromUserId_idx" ON "intro_requests"("fromUserId");

-- CreateIndex
CREATE INDEX "intro_requests_toUserId_idx" ON "intro_requests"("toUserId");

-- CreateIndex
CREATE UNIQUE INDEX "cms_content_key_key" ON "cms_content"("key");

-- CreateIndex
CREATE UNIQUE INDEX "platform_stats_metricName_key" ON "platform_stats"("metricName");

-- AddForeignKey
ALTER TABLE "founder_profiles" ADD CONSTRAINT "founder_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_profiles" ADD CONSTRAINT "investor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_profiles" ADD CONSTRAINT "admin_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_invites" ADD CONSTRAINT "admin_invites_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_room_files" ADD CONSTRAINT "data_room_files_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_room_access_log" ADD CONSTRAINT "data_room_access_log_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "data_room_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_room_access_log" ADD CONSTRAINT "data_room_access_log_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_shortlist" ADD CONSTRAINT "saved_shortlist_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_shortlist" ADD CONSTRAINT "saved_shortlist_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intro_requests" ADD CONSTRAINT "intro_requests_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intro_requests" ADD CONSTRAINT "intro_requests_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_content" ADD CONSTRAINT "cms_content_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

