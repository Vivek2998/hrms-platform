-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "employeeCodePrefix" TEXT NOT NULL DEFAULT 'EMP',
ADD COLUMN     "employeeSequence" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "payslips_organizationId_payrollRunId_idx" ON "payslips"("organizationId", "payrollRunId");

-- CreateIndex
CREATE INDEX "salary_revisions_organizationId_effectiveFrom_idx" ON "salary_revisions"("organizationId", "effectiveFrom");
