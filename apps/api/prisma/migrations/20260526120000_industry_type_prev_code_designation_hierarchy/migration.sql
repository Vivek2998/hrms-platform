-- Add industryType to organizations
ALTER TABLE "organizations" ADD COLUMN "industryType" TEXT NOT NULL DEFAULT 'IT_SOFTWARE';

-- Add previousEmployeeCode to employees (audit trail for code renames)
ALTER TABLE "employees" ADD COLUMN "previousEmployeeCode" TEXT;

-- Add hierarchy + templateKey to designations
ALTER TABLE "designations" ADD COLUMN "parentId" TEXT;
ALTER TABLE "designations" ADD COLUMN "templateKey" TEXT;

-- FK: designations.parentId → designations.id (self-referencing hierarchy)
ALTER TABLE "designations" ADD CONSTRAINT "designations_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "designations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Clear stale designationId values in employees that don't point to real designations
-- (safe no-op if all are already NULL or valid)
UPDATE "employees"
SET "designationId" = NULL
WHERE "designationId" IS NOT NULL
  AND "designationId" NOT IN (SELECT "id" FROM "designations");

-- FK: employees.designationId → designations.id
ALTER TABLE "employees" ADD CONSTRAINT "employees_designationId_fkey"
  FOREIGN KEY ("designationId") REFERENCES "designations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
