-- CreateEnum
CREATE TYPE "RegularisationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CompOffStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "attendance_regularisations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "requestedIn" TEXT,
    "requestedOut" TEXT,
    "reason" TEXT NOT NULL,
    "status" "RegularisationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_regularisations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comp_offs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "workedDate" DATE NOT NULL,
    "requestedDate" DATE,
    "reason" TEXT NOT NULL,
    "status" "CompOffStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "expiresAt" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comp_offs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_declarations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "regime" TEXT NOT NULL DEFAULT 'OLD',
    "ppf" DOUBLE PRECISION,
    "epf" DOUBLE PRECISION,
    "elss" DOUBLE PRECISION,
    "lic" DOUBLE PRECISION,
    "nsc" DOUBLE PRECISION,
    "homeLoanPrincipal" DOUBLE PRECISION,
    "tuitionFees" DOUBLE PRECISION,
    "sukanyaSamriddhi" DOUBLE PRECISION,
    "healthInsuranceSelf" DOUBLE PRECISION,
    "healthInsuranceParents" DOUBLE PRECISION,
    "rentPaid" DOUBLE PRECISION,
    "landlordPan" TEXT,
    "npsEmployee" DOUBLE PRECISION,
    "homeLoanInterest" DOUBLE PRECISION,
    "savingsInterest" DOUBLE PRECISION,
    "otherDeductions" JSONB,
    "totalDeclared" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_declarations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attendance_regularisations_organizationId_employeeId_idx" ON "attendance_regularisations"("organizationId", "employeeId");

-- CreateIndex
CREATE INDEX "attendance_regularisations_organizationId_status_idx" ON "attendance_regularisations"("organizationId", "status");

-- CreateIndex
CREATE INDEX "comp_offs_organizationId_employeeId_idx" ON "comp_offs"("organizationId", "employeeId");

-- CreateIndex
CREATE INDEX "comp_offs_organizationId_status_idx" ON "comp_offs"("organizationId", "status");

-- CreateIndex
CREATE INDEX "tax_declarations_organizationId_employeeId_idx" ON "tax_declarations"("organizationId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "tax_declarations_organizationId_employeeId_financialYear_key" ON "tax_declarations"("organizationId", "employeeId", "financialYear");

-- AddForeignKey
ALTER TABLE "attendance_regularisations" ADD CONSTRAINT "attendance_regularisations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comp_offs" ADD CONSTRAINT "comp_offs_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_declarations" ADD CONSTRAINT "tax_declarations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
