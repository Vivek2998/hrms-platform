-- CreateEnum
CREATE TYPE "TravelStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TravelMode" AS ENUM ('FLIGHT', 'TRAIN', 'BUS', 'CAR', 'OTHER');

-- CreateTable
CREATE TABLE "travel_requests" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "fromCity" TEXT NOT NULL,
    "toCity" TEXT NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3),
    "travelMode" "TravelMode" NOT NULL DEFAULT 'FLIGHT',
    "estimatedBudget" DECIMAL(12,2),
    "hotelRequired" BOOLEAN NOT NULL DEFAULT false,
    "advanceRequired" BOOLEAN NOT NULL DEFAULT false,
    "advanceAmount" DECIMAL(12,2),
    "status" "TravelStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "travel_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "travel_requests_organizationId_employeeId_idx" ON "travel_requests"("organizationId", "employeeId");

-- CreateIndex
CREATE INDEX "travel_requests_organizationId_status_idx" ON "travel_requests"("organizationId", "status");

-- AddForeignKey
ALTER TABLE "travel_requests" ADD CONSTRAINT "travel_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_requests" ADD CONSTRAINT "travel_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_requests" ADD CONSTRAINT "travel_requests_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
