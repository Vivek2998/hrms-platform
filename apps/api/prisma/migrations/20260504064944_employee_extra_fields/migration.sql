-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "designation" TEXT,
ADD COLUMN     "educationDetails" JSONB,
ADD COLUMN     "experienceDetails" JSONB,
ADD COLUMN     "maritalStatus" TEXT;
