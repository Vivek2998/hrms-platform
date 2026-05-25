-- CreateEnum
CREATE TYPE "EmpCodeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "employee_code_change_requests" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "currentPrefix" TEXT NOT NULL,
    "requestedPrefix" TEXT NOT NULL,
    "applyToExisting" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "status" "EmpCodeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "superAdminNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_code_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_code_change_requests_organizationId_status_idx" ON "employee_code_change_requests"("organizationId", "status");

-- CreateIndex
CREATE INDEX "employee_code_change_requests_status_idx" ON "employee_code_change_requests"("status");

-- AddForeignKey
ALTER TABLE "employee_code_change_requests" ADD CONSTRAINT "employee_code_change_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_code_change_requests" ADD CONSTRAINT "employee_code_change_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
