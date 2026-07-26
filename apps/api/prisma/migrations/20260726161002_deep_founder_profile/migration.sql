-- CreateEnum
CREATE TYPE "SwotCategory" AS ENUM ('STRENGTH', 'WEAKNESS', 'OPPORTUNITY', 'THREAT');

-- CreateEnum
CREATE TYPE "RiskSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProfileSection" ADD VALUE 'RISKS';
ALTER TYPE "ProfileSection" ADD VALUE 'FUTURE_PLANS';

-- AlterTable
ALTER TABLE "founder_profiles" ADD COLUMN     "annualRevenue" INTEGER,
ADD COLUMN     "businessModel" TEXT,
ADD COLUMN     "cashBalance" INTEGER,
ADD COLUMN     "futurePlansVisibility" "DataRoomVisibility" NOT NULL DEFAULT 'PRIVATE',
ADD COLUMN     "grossMarginPct" INTEGER,
ADD COLUMN     "marketGeography" TEXT,
ADD COLUMN     "marketSize" TEXT,
ADD COLUMN     "priorYearArr" INTEGER,
ADD COLUMN     "risksVisibility" "DataRoomVisibility" NOT NULL DEFAULT 'PRIVATE',
ADD COLUMN     "targetSegment" TEXT,
ADD COLUMN     "usp" TEXT;

-- CreateTable
CREATE TABLE "promoters" (
    "id" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "background" TEXT,
    "shareholdingPct" DOUBLE PRECISION,
    "priorExperience" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promoters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_companies" (
    "id" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT,
    "ownershipPct" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products_services" (
    "id" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitors" (
    "id" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "differentiation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "swot_items" (
    "id" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "category" "SwotCategory" NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "swot_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_items" (
    "id" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" "RiskSeverity",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "future_plans" (
    "id" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "timeframe" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "future_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benchmark_peers" (
    "id" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "peerName" TEXT NOT NULL,
    "arr" INTEGER,
    "growthPct" INTEGER,
    "grossMarginPct" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "benchmark_peers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "promoters_founderId_idx" ON "promoters"("founderId");

-- CreateIndex
CREATE INDEX "group_companies_founderId_idx" ON "group_companies"("founderId");

-- CreateIndex
CREATE INDEX "products_services_founderId_idx" ON "products_services"("founderId");

-- CreateIndex
CREATE INDEX "competitors_founderId_idx" ON "competitors"("founderId");

-- CreateIndex
CREATE INDEX "swot_items_founderId_category_idx" ON "swot_items"("founderId", "category");

-- CreateIndex
CREATE INDEX "risk_items_founderId_idx" ON "risk_items"("founderId");

-- CreateIndex
CREATE INDEX "future_plans_founderId_idx" ON "future_plans"("founderId");

-- CreateIndex
CREATE INDEX "benchmark_peers_founderId_idx" ON "benchmark_peers"("founderId");

-- AddForeignKey
ALTER TABLE "promoters" ADD CONSTRAINT "promoters_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "founder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_companies" ADD CONSTRAINT "group_companies_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "founder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products_services" ADD CONSTRAINT "products_services_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "founder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "founder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swot_items" ADD CONSTRAINT "swot_items_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "founder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_items" ADD CONSTRAINT "risk_items_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "founder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "future_plans" ADD CONSTRAINT "future_plans_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "founder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benchmark_peers" ADD CONSTRAINT "benchmark_peers_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "founder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

