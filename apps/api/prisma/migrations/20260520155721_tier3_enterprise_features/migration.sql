-- CreateEnum
CREATE TYPE "EwaStatus" AS ENUM ('PENDING', 'APPROVED', 'DISBURSED', 'REJECTED', 'REPAID');

-- CreateEnum
CREATE TYPE "DriveType" AS ENUM ('CAMPUS', 'WALKIN', 'REFERRAL_DRIVE', 'LATERAL');

-- CreateEnum
CREATE TYPE "DriveStatus" AS ENUM ('PLANNED', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ContractorType" AS ENUM ('INDIVIDUAL', 'AGENCY', 'FREELANCER');

-- CreateEnum
CREATE TYPE "ContractorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLACKLISTED');

-- CreateEnum
CREATE TYPE "EsopStatus" AS ENUM ('ACTIVE', 'VESTED', 'EXERCISED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "ewa_requests" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "EwaStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "repaymentDate" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "ewa_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attrition_scores" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "factors" JSONB NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attrition_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biometric_devices" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "serialNumber" TEXT,
    "ipAddress" TEXT,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "biometric_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biometric_device_logs" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "employeeId" TEXT,
    "eventType" TEXT NOT NULL,
    "deviceTime" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raw" JSONB,

    CONSTRAINT "biometric_device_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hiring_drives" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "driveType" "DriveType" NOT NULL DEFAULT 'CAMPUS',
    "venue" TEXT,
    "driveDate" TIMESTAMP(3),
    "targetCount" INTEGER NOT NULL DEFAULT 0,
    "status" "DriveStatus" NOT NULL DEFAULT 'PLANNED',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hiring_drives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulk_candidates" (
    "id" TEXT NOT NULL,
    "driveId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "college" TEXT,
    "degree" TEXT,
    "cgpa" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "offerSentAt" TIMESTAMP(3),
    "resumeUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bulk_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pay_equity_snapshots" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportData" JSONB NOT NULL,
    "generatedBy" TEXT,

    CONSTRAINT "pay_equity_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_scorecards" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "applicationId" TEXT,
    "interviewId" TEXT,
    "candidateName" TEXT NOT NULL,
    "interviewerIds" TEXT[],
    "template" JSONB NOT NULL,
    "scores" JSONB NOT NULL,
    "overallRating" DOUBLE PRECISION,
    "recommendation" TEXT,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_scorecards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parsed_resumes" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "parsedData" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parsed_resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contractors" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "pan" TEXT,
    "gstNumber" TEXT,
    "contractType" "ContractorType" NOT NULL DEFAULT 'INDIVIDUAL',
    "skills" TEXT[],
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "dailyRate" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "ContractorStatus" NOT NULL DEFAULT 'ACTIVE',
    "documents" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contractors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "invoiceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esop_grants" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "grantDate" TIMESTAMP(3) NOT NULL,
    "options" INTEGER NOT NULL,
    "strikePrice" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "vestingSchedule" JSONB NOT NULL,
    "cliffMonths" INTEGER NOT NULL DEFAULT 12,
    "totalVestMonths" INTEGER NOT NULL DEFAULT 48,
    "status" "EsopStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "esop_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esop_exercises" (
    "id" TEXT NOT NULL,
    "grantId" TEXT NOT NULL,
    "options" INTEGER NOT NULL,
    "exercisePrice" DOUBLE PRECISION NOT NULL,
    "exercisedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "esop_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eap_resources" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "providerName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "websiteUrl" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eap_resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ewa_requests_organizationId_employeeId_idx" ON "ewa_requests"("organizationId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "attrition_scores_employeeId_key" ON "attrition_scores"("employeeId");

-- CreateIndex
CREATE INDEX "attrition_scores_organizationId_riskLevel_idx" ON "attrition_scores"("organizationId", "riskLevel");

-- CreateIndex
CREATE INDEX "biometric_devices_organizationId_idx" ON "biometric_devices"("organizationId");

-- CreateIndex
CREATE INDEX "biometric_device_logs_deviceId_deviceTime_idx" ON "biometric_device_logs"("deviceId", "deviceTime");

-- CreateIndex
CREATE INDEX "hiring_drives_organizationId_status_idx" ON "hiring_drives"("organizationId", "status");

-- CreateIndex
CREATE INDEX "bulk_candidates_driveId_status_idx" ON "bulk_candidates"("driveId", "status");

-- CreateIndex
CREATE INDEX "pay_equity_snapshots_organizationId_idx" ON "pay_equity_snapshots"("organizationId");

-- CreateIndex
CREATE INDEX "interview_scorecards_organizationId_applicationId_idx" ON "interview_scorecards"("organizationId", "applicationId");

-- CreateIndex
CREATE INDEX "parsed_resumes_organizationId_status_idx" ON "parsed_resumes"("organizationId", "status");

-- CreateIndex
CREATE INDEX "contractors_organizationId_status_idx" ON "contractors"("organizationId", "status");

-- CreateIndex
CREATE INDEX "purchase_orders_contractorId_status_idx" ON "purchase_orders"("contractorId", "status");

-- CreateIndex
CREATE INDEX "esop_grants_organizationId_employeeId_idx" ON "esop_grants"("organizationId", "employeeId");

-- CreateIndex
CREATE INDEX "esop_exercises_grantId_idx" ON "esop_exercises"("grantId");

-- CreateIndex
CREATE INDEX "eap_resources_organizationId_category_idx" ON "eap_resources"("organizationId", "category");

-- AddForeignKey
ALTER TABLE "ewa_requests" ADD CONSTRAINT "ewa_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ewa_requests" ADD CONSTRAINT "ewa_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attrition_scores" ADD CONSTRAINT "attrition_scores_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attrition_scores" ADD CONSTRAINT "attrition_scores_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biometric_devices" ADD CONSTRAINT "biometric_devices_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biometric_device_logs" ADD CONSTRAINT "biometric_device_logs_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "biometric_devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hiring_drives" ADD CONSTRAINT "hiring_drives_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_candidates" ADD CONSTRAINT "bulk_candidates_driveId_fkey" FOREIGN KEY ("driveId") REFERENCES "hiring_drives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pay_equity_snapshots" ADD CONSTRAINT "pay_equity_snapshots_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_scorecards" ADD CONSTRAINT "interview_scorecards_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parsed_resumes" ADD CONSTRAINT "parsed_resumes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contractors" ADD CONSTRAINT "contractors_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "contractors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esop_grants" ADD CONSTRAINT "esop_grants_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esop_grants" ADD CONSTRAINT "esop_grants_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esop_exercises" ADD CONSTRAINT "esop_exercises_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "esop_grants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eap_resources" ADD CONSTRAINT "eap_resources_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
