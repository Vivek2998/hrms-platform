-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DocumentType" ADD VALUE 'ID_CARD';
ALTER TYPE "DocumentType" ADD VALUE 'INSURANCE';
ALTER TYPE "DocumentType" ADD VALUE 'NDA';
ALTER TYPE "DocumentType" ADD VALUE 'AGREEMENT';
ALTER TYPE "DocumentType" ADD VALUE 'COMPANY_POLICY';
ALTER TYPE "DocumentType" ADD VALUE 'BACKGROUND_CHECK';
ALTER TYPE "DocumentType" ADD VALUE 'MEDICAL_CERTIFICATE';
ALTER TYPE "DocumentType" ADD VALUE 'PF_STATEMENT';

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" "DocumentStatus" NOT NULL DEFAULT 'APPROVED';
