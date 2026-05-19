-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'UNDER_REPAIR', 'RETIRED', 'LOST');

-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('LAPTOP', 'DESKTOP', 'PHONE', 'TABLET', 'MONITOR', 'KEYBOARD', 'MOUSE', 'HEADSET', 'CHAIR', 'DESK', 'ID_CARD', 'ACCESS_CARD', 'OTHER');

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "AssetCategory" NOT NULL DEFAULT 'OTHER',
    "serialNumber" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DECIMAL(12,2),
    "warrantyExpiry" TIMESTAMP(3),
    "status" "AssetStatus" NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_assignments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" TIMESTAMP(3),
    "condition" TEXT,
    "notes" TEXT,

    CONSTRAINT "asset_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assets_organizationId_idx" ON "assets"("organizationId");

-- CreateIndex
CREATE INDEX "assets_organizationId_status_idx" ON "assets"("organizationId", "status");

-- CreateIndex
CREATE INDEX "asset_assignments_organizationId_assetId_idx" ON "asset_assignments"("organizationId", "assetId");

-- CreateIndex
CREATE INDEX "asset_assignments_organizationId_employeeId_idx" ON "asset_assignments"("organizationId", "employeeId");

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
