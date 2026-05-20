-- CreateEnum
CREATE TYPE "RevisionProposalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "POSHCaseStatus" AS ENUM ('FILED', 'UNDER_INVESTIGATION', 'HEARING', 'RESOLVED', 'DISMISSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TimesheetStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BenefitType" AS ENUM ('HEALTH_INSURANCE', 'LIFE_INSURANCE', 'NPS', 'GYM', 'MEAL_ALLOWANCE', 'TRANSPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "BenefitEnrollmentStatus" AS ENUM ('PENDING', 'ENROLLED', 'WAIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PIPStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXTENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "SuccessorReadiness" AS ENUM ('READY_NOW', 'ONE_TO_TWO_YEARS', 'THREE_TO_FIVE_YEARS');

-- CreateEnum
CREATE TYPE "OpenPositionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'FILLED', 'ON_HOLD', 'CANCELLED');

-- CreateTable
CREATE TABLE "policy_acknowledgments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_acknowledgments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_revision_proposals" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "proposedById" TEXT NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "currentCtc" DOUBLE PRECISION NOT NULL,
    "proposedCtc" DOUBLE PRECISION NOT NULL,
    "currentBasic" DOUBLE PRECISION NOT NULL,
    "proposedBasic" DOUBLE PRECISION NOT NULL,
    "currentGross" DOUBLE PRECISION NOT NULL,
    "proposedGross" DOUBLE PRECISION NOT NULL,
    "currentNetPay" DOUBLE PRECISION NOT NULL,
    "proposedNetPay" DOUBLE PRECISION NOT NULL,
    "components" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RevisionProposalStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_revision_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posh_cases" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "complainantId" TEXT NOT NULL,
    "respondentName" TEXT NOT NULL,
    "incidentDate" DATE NOT NULL,
    "incidentLocation" TEXT,
    "description" TEXT NOT NULL,
    "status" "POSHCaseStatus" NOT NULL DEFAULT 'FILED',
    "assignedTo" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posh_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posh_case_updates" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "posh_case_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "clientName" TEXT,
    "isBillable" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timesheet_entries" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "isBillable" BOOLEAN NOT NULL DEFAULT true,
    "status" "TimesheetStatus" NOT NULL DEFAULT 'DRAFT',
    "weekStart" DATE NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timesheet_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benefit_plans" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BenefitType" NOT NULL,
    "description" TEXT,
    "maxAmount" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "enrollmentDeadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "benefit_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benefit_enrollments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "status" "BenefitEnrollmentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION,
    "details" JSONB,
    "enrolledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "benefit_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_improvement_plans" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" "PIPStatus" NOT NULL DEFAULT 'ACTIVE',
    "outcome" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_improvement_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pip_goals" (
    "id" TEXT NOT NULL,
    "pipId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetDate" DATE,
    "status" "GoalStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pip_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pip_check_ins" (
    "id" TEXT NOT NULL,
    "pipId" TEXT NOT NULL,
    "conductedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "progress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pip_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nine_box_assessments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "cycleId" TEXT,
    "employeeId" TEXT NOT NULL,
    "assessedById" TEXT NOT NULL,
    "performance" INTEGER NOT NULL,
    "potential" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nine_box_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "headcount_plans" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "departmentId" TEXT,
    "financialYear" TEXT NOT NULL,
    "budgetedCount" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "headcount_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "open_positions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "planId" TEXT,
    "departmentId" TEXT,
    "title" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "status" "OpenPositionStatus" NOT NULL DEFAULT 'OPEN',
    "targetDate" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "open_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "department" TEXT,
    "description" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "designations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_paths" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fromDesignationId" TEXT NOT NULL,
    "toDesignationId" TEXT NOT NULL,
    "typicalYears" INTEGER,
    "skillsRequired" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "career_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "succession_plans" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "departmentId" TEXT,
    "isCritical" BOOLEAN NOT NULL DEFAULT true,
    "riskLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "succession_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "successor_nominations" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "readiness" "SuccessorReadiness" NOT NULL DEFAULT 'ONE_TO_TWO_YEARS',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "successor_nominations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "policy_acknowledgments_organizationId_policyId_idx" ON "policy_acknowledgments"("organizationId", "policyId");

-- CreateIndex
CREATE UNIQUE INDEX "policy_acknowledgments_policyId_employeeId_key" ON "policy_acknowledgments"("policyId", "employeeId");

-- CreateIndex
CREATE INDEX "salary_revision_proposals_organizationId_employeeId_idx" ON "salary_revision_proposals"("organizationId", "employeeId");

-- CreateIndex
CREATE INDEX "salary_revision_proposals_organizationId_status_idx" ON "salary_revision_proposals"("organizationId", "status");

-- CreateIndex
CREATE INDEX "posh_cases_organizationId_status_idx" ON "posh_cases"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "posh_cases_organizationId_caseNumber_key" ON "posh_cases"("organizationId", "caseNumber");

-- CreateIndex
CREATE INDEX "posh_case_updates_caseId_idx" ON "posh_case_updates"("caseId");

-- CreateIndex
CREATE INDEX "projects_organizationId_idx" ON "projects"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "projects_organizationId_code_key" ON "projects"("organizationId", "code");

-- CreateIndex
CREATE INDEX "timesheet_entries_organizationId_employeeId_idx" ON "timesheet_entries"("organizationId", "employeeId");

-- CreateIndex
CREATE INDEX "timesheet_entries_organizationId_weekStart_idx" ON "timesheet_entries"("organizationId", "weekStart");

-- CreateIndex
CREATE INDEX "benefit_plans_organizationId_idx" ON "benefit_plans"("organizationId");

-- CreateIndex
CREATE INDEX "benefit_enrollments_organizationId_employeeId_idx" ON "benefit_enrollments"("organizationId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "benefit_enrollments_planId_employeeId_key" ON "benefit_enrollments"("planId", "employeeId");

-- CreateIndex
CREATE INDEX "performance_improvement_plans_organizationId_employeeId_idx" ON "performance_improvement_plans"("organizationId", "employeeId");

-- CreateIndex
CREATE INDEX "performance_improvement_plans_organizationId_status_idx" ON "performance_improvement_plans"("organizationId", "status");

-- CreateIndex
CREATE INDEX "pip_goals_pipId_idx" ON "pip_goals"("pipId");

-- CreateIndex
CREATE INDEX "pip_check_ins_pipId_idx" ON "pip_check_ins"("pipId");

-- CreateIndex
CREATE INDEX "nine_box_assessments_organizationId_idx" ON "nine_box_assessments"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "nine_box_assessments_organizationId_cycleId_employeeId_key" ON "nine_box_assessments"("organizationId", "cycleId", "employeeId");

-- CreateIndex
CREATE INDEX "headcount_plans_organizationId_idx" ON "headcount_plans"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "headcount_plans_organizationId_departmentId_financialYear_key" ON "headcount_plans"("organizationId", "departmentId", "financialYear");

-- CreateIndex
CREATE INDEX "open_positions_organizationId_status_idx" ON "open_positions"("organizationId", "status");

-- CreateIndex
CREATE INDEX "designations_organizationId_idx" ON "designations"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "designations_organizationId_name_key" ON "designations"("organizationId", "name");

-- CreateIndex
CREATE INDEX "career_paths_organizationId_idx" ON "career_paths"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "career_paths_organizationId_fromDesignationId_toDesignation_key" ON "career_paths"("organizationId", "fromDesignationId", "toDesignationId");

-- CreateIndex
CREATE INDEX "succession_plans_organizationId_idx" ON "succession_plans"("organizationId");

-- CreateIndex
CREATE INDEX "successor_nominations_planId_idx" ON "successor_nominations"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "successor_nominations_planId_employeeId_key" ON "successor_nominations"("planId", "employeeId");

-- CreateIndex
CREATE INDEX "chat_sessions_organizationId_employeeId_idx" ON "chat_sessions"("organizationId", "employeeId");

-- CreateIndex
CREATE INDEX "chat_messages_sessionId_idx" ON "chat_messages"("sessionId");

-- AddForeignKey
ALTER TABLE "policy_acknowledgments" ADD CONSTRAINT "policy_acknowledgments_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "hr_policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_acknowledgments" ADD CONSTRAINT "policy_acknowledgments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_revision_proposals" ADD CONSTRAINT "salary_revision_proposals_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_revision_proposals" ADD CONSTRAINT "salary_revision_proposals_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_revision_proposals" ADD CONSTRAINT "salary_revision_proposals_proposedById_fkey" FOREIGN KEY ("proposedById") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_revision_proposals" ADD CONSTRAINT "salary_revision_proposals_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posh_cases" ADD CONSTRAINT "posh_cases_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posh_cases" ADD CONSTRAINT "posh_cases_complainantId_fkey" FOREIGN KEY ("complainantId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posh_case_updates" ADD CONSTRAINT "posh_case_updates_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "posh_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posh_case_updates" ADD CONSTRAINT "posh_case_updates_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheet_entries" ADD CONSTRAINT "timesheet_entries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheet_entries" ADD CONSTRAINT "timesheet_entries_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheet_entries" ADD CONSTRAINT "timesheet_entries_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheet_entries" ADD CONSTRAINT "timesheet_entries_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefit_plans" ADD CONSTRAINT "benefit_plans_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefit_enrollments" ADD CONSTRAINT "benefit_enrollments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefit_enrollments" ADD CONSTRAINT "benefit_enrollments_planId_fkey" FOREIGN KEY ("planId") REFERENCES "benefit_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefit_enrollments" ADD CONSTRAINT "benefit_enrollments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_improvement_plans" ADD CONSTRAINT "performance_improvement_plans_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_improvement_plans" ADD CONSTRAINT "performance_improvement_plans_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_improvement_plans" ADD CONSTRAINT "performance_improvement_plans_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pip_goals" ADD CONSTRAINT "pip_goals_pipId_fkey" FOREIGN KEY ("pipId") REFERENCES "performance_improvement_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pip_check_ins" ADD CONSTRAINT "pip_check_ins_pipId_fkey" FOREIGN KEY ("pipId") REFERENCES "performance_improvement_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nine_box_assessments" ADD CONSTRAINT "nine_box_assessments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nine_box_assessments" ADD CONSTRAINT "nine_box_assessments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nine_box_assessments" ADD CONSTRAINT "nine_box_assessments_assessedById_fkey" FOREIGN KEY ("assessedById") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "headcount_plans" ADD CONSTRAINT "headcount_plans_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_positions" ADD CONSTRAINT "open_positions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_positions" ADD CONSTRAINT "open_positions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "headcount_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designations" ADD CONSTRAINT "designations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_paths" ADD CONSTRAINT "career_paths_fromDesignationId_fkey" FOREIGN KEY ("fromDesignationId") REFERENCES "designations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_paths" ADD CONSTRAINT "career_paths_toDesignationId_fkey" FOREIGN KEY ("toDesignationId") REFERENCES "designations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "succession_plans" ADD CONSTRAINT "succession_plans_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "successor_nominations" ADD CONSTRAINT "successor_nominations_planId_fkey" FOREIGN KEY ("planId") REFERENCES "succession_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "successor_nominations" ADD CONSTRAINT "successor_nominations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
