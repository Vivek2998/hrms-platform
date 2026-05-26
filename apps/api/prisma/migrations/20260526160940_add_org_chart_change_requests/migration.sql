-- CreateTable
CREATE TABLE "org_chart_change_requests" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "currentIndustry" TEXT NOT NULL,
    "requestedIndustry" TEXT NOT NULL,
    "reason" TEXT,
    "status" "EmpCodeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "superAdminNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "org_chart_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "org_chart_change_requests_organizationId_status_idx" ON "org_chart_change_requests"("organizationId", "status");

-- CreateIndex
CREATE INDEX "org_chart_change_requests_status_idx" ON "org_chart_change_requests"("status");

-- AddForeignKey
ALTER TABLE "org_chart_change_requests" ADD CONSTRAINT "org_chart_change_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_chart_change_requests" ADD CONSTRAINT "org_chart_change_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
