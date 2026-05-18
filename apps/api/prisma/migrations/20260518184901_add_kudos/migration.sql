-- CreateEnum
CREATE TYPE "KudosCategory" AS ENUM ('TEAMWORK', 'INNOVATION', 'LEADERSHIP', 'CUSTOMER_FOCUS', 'GOING_ABOVE_AND_BEYOND', 'PROBLEM_SOLVING', 'MENTORSHIP', 'OTHER');

-- CreateTable
CREATE TABLE "kudos" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fromEmployeeId" TEXT NOT NULL,
    "toEmployeeId" TEXT NOT NULL,
    "category" "KudosCategory" NOT NULL DEFAULT 'OTHER',
    "message" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "reactions" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kudos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kudos_organizationId_idx" ON "kudos"("organizationId");

-- CreateIndex
CREATE INDEX "kudos_organizationId_toEmployeeId_idx" ON "kudos"("organizationId", "toEmployeeId");

-- AddForeignKey
ALTER TABLE "kudos" ADD CONSTRAINT "kudos_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kudos" ADD CONSTRAINT "kudos_fromEmployeeId_fkey" FOREIGN KEY ("fromEmployeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kudos" ADD CONSTRAINT "kudos_toEmployeeId_fkey" FOREIGN KEY ("toEmployeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
