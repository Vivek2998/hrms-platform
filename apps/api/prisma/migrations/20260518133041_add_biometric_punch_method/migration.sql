-- CreateEnum
CREATE TYPE "PunchMethod" AS ENUM ('FINGERPRINT', 'FACE_ID', 'MANUAL');

-- CreateEnum
CREATE TYPE "BiometricPreference" AS ENUM ('FINGERPRINT_FIRST', 'FACE_FIRST', 'BIOMETRIC_ANY', 'NO_BIOMETRIC');

-- AlterTable
ALTER TABLE "attendance_records" ADD COLUMN     "punchMethod" "PunchMethod";

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "biometricPreference" "BiometricPreference" NOT NULL DEFAULT 'FINGERPRINT_FIRST';
