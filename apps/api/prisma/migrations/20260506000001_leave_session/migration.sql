-- CreateEnum
CREATE TYPE "LeaveSession" AS ENUM ('FIRST_HALF', 'SECOND_HALF');

-- AlterTable
ALTER TABLE "leave_requests" ADD COLUMN "session" "LeaveSession";
