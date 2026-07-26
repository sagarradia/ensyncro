-- CreateEnum
CREATE TYPE "NatureOfBusiness" AS ENUM ('MANUFACTURING', 'TRADING', 'SERVICE');

-- CreateEnum
CREATE TYPE "BusinessStage" AS ENUM ('IDEA', 'STARTUP', 'EARLY_REVENUE', 'GROWTH', 'EXPANSION', 'MATURE', 'TURNAROUND');

-- CreateEnum
CREATE TYPE "CompanyClassification" AS ENUM ('MSME', 'LARGE_ENTERPRISE', 'LISTED', 'UNLISTED', 'GOVERNMENT', 'PSU');

-- CreateEnum
CREATE TYPE "FundingRequirementType" AS ENUM ('SEED', 'ANGEL', 'GROWTH', 'EXPANSION', 'BRIDGE', 'PRE_IPO', 'STRATEGIC', 'ACQUISITION');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProfileSection" ADD VALUE 'SHAREHOLDING';
ALTER TYPE "ProfileSection" ADD VALUE 'PROJECTED_FINANCIALS';

-- AlterTable
ALTER TABLE "founder_profiles" ADD COLUMN     "businessStage" "BusinessStage",
ADD COLUMN     "companyClassification" "CompanyClassification",
ADD COLUMN     "fundingInstrument" TEXT,
ADD COLUMN     "fundingRequirementType" "FundingRequirementType",
ADD COLUMN     "fundingUseSummary" TEXT,
ADD COLUMN     "manufacturing" TEXT,
ADD COLUMN     "natureOfBusiness" "NatureOfBusiness"[],
ADD COLUMN     "operations" TEXT,
ADD COLUMN     "projectedFinancialsVisibility" "DataRoomVisibility" NOT NULL DEFAULT 'PRIVATE',
ADD COLUMN     "shareholdingVisibility" "DataRoomVisibility" NOT NULL DEFAULT 'PRIVATE';

-- CreateTable
CREATE TABLE "shareholders" (
    "id" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shareClass" TEXT,
    "percentage" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shareholders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "key_customers" (
    "id" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "key_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projected_financials" (
    "id" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "revenue" INTEGER,
    "ebitda" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projected_financials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sector_masters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sector_masters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shareholders_founderId_idx" ON "shareholders"("founderId");

-- CreateIndex
CREATE INDEX "key_customers_founderId_idx" ON "key_customers"("founderId");

-- CreateIndex
CREATE INDEX "suppliers_founderId_idx" ON "suppliers"("founderId");

-- CreateIndex
CREATE INDEX "projected_financials_founderId_idx" ON "projected_financials"("founderId");

-- CreateIndex
CREATE UNIQUE INDEX "sector_masters_name_key" ON "sector_masters"("name");

-- AddForeignKey
ALTER TABLE "shareholders" ADD CONSTRAINT "shareholders_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "founder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_customers" ADD CONSTRAINT "key_customers_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "founder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "founder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projected_financials" ADD CONSTRAINT "projected_financials_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "founder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Seed the sector masters (§8 examples; admin-extensible later).
INSERT INTO "sector_masters" ("id","name","active","sortOrder") VALUES
  (gen_random_uuid(),'IT & Software',true,1),
  (gen_random_uuid(),'Chemicals',true,2),
  (gen_random_uuid(),'Pharma & Healthcare',true,3),
  (gen_random_uuid(),'Agriculture',true,4),
  (gen_random_uuid(),'FMCG',true,5),
  (gen_random_uuid(),'Infrastructure',true,6),
  (gen_random_uuid(),'Retail',true,7),
  (gen_random_uuid(),'Logistics',true,8),
  (gen_random_uuid(),'Financial Services',true,9),
  (gen_random_uuid(),'Climate & Energy',true,10)
ON CONFLICT ("name") DO NOTHING;
