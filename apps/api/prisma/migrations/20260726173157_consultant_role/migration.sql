-- CreateEnum
CREATE TYPE "ConsultantType" AS ENUM ('CA', 'CS', 'ADVOCATE', 'VALUER');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'CONSULTANT';

-- CreateTable
CREATE TABLE "consultant_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consultantType" "ConsultantType" NOT NULL,
    "name" TEXT,
    "firm" TEXT,
    "registrationNumber" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultant_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultant_invites" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "consultantType" "ConsultantType" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultant_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "consultant_profiles_userId_key" ON "consultant_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "consultant_invites_tokenHash_key" ON "consultant_invites"("tokenHash");

-- CreateIndex
CREATE INDEX "consultant_invites_email_idx" ON "consultant_invites"("email");

-- AddForeignKey
ALTER TABLE "consultant_profiles" ADD CONSTRAINT "consultant_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultant_invites" ADD CONSTRAINT "consultant_invites_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

