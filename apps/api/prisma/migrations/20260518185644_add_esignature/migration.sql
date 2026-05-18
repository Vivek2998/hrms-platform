-- CreateEnum
CREATE TYPE "ESignatureStatus" AS ENUM ('PENDING', 'SIGNED', 'DECLINED', 'EXPIRED');

-- CreateTable
CREATE TABLE "esignature_requests" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "documentId" TEXT,
    "documentName" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "requestedTo" TEXT NOT NULL,
    "status" "ESignatureStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "signedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "declineReason" TEXT,
    "signatureImageUrl" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "esignature_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "esignature_requests_organizationId_idx" ON "esignature_requests"("organizationId");

-- CreateIndex
CREATE INDEX "esignature_requests_organizationId_requestedTo_idx" ON "esignature_requests"("organizationId", "requestedTo");

-- AddForeignKey
ALTER TABLE "esignature_requests" ADD CONSTRAINT "esignature_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esignature_requests" ADD CONSTRAINT "esignature_requests_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esignature_requests" ADD CONSTRAINT "esignature_requests_requestedTo_fkey" FOREIGN KEY ("requestedTo") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
