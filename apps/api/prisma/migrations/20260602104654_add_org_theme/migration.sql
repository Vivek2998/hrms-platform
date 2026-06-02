-- CreateTable
CREATE TABLE "org_theme_configs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "primaryColor" TEXT,
    "primaryForeground" TEXT,
    "sidebarStyle" TEXT NOT NULL DEFAULT 'light',
    "bgImageUrl" TEXT,
    "backgroundColor" TEXT,
    "cardColor" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedById" TEXT,

    CONSTRAINT "org_theme_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_theme_requests" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "preferredPrimaryHex" TEXT,
    "sidebarStyle" TEXT,
    "wantsBgImage" BOOLEAN NOT NULL DEFAULT false,
    "bgImageUrl" TEXT,
    "backgroundColor" TEXT,
    "logoUrl" TEXT,
    "notes" TEXT,
    "attachmentUrls" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "superAdminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "org_theme_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "org_theme_configs_organizationId_key" ON "org_theme_configs"("organizationId");

-- CreateIndex
CREATE INDEX "org_theme_requests_organizationId_idx" ON "org_theme_requests"("organizationId");

-- CreateIndex
CREATE INDEX "org_theme_requests_status_idx" ON "org_theme_requests"("status");

-- AddForeignKey
ALTER TABLE "org_theme_configs" ADD CONSTRAINT "org_theme_configs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_theme_requests" ADD CONSTRAINT "org_theme_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_theme_requests" ADD CONSTRAINT "org_theme_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
