/*
  Warnings:

  - You are about to drop the column `comments` on the `peer_feedbacks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "peer_feedbacks" DROP COLUMN "comments",
ADD COLUMN     "improvements" TEXT,
ADD COLUMN     "strengths" TEXT;

-- AlterTable
ALTER TABLE "performance_goals" ADD COLUMN     "dueDate" DATE,
ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "targetValue" SET DATA TYPE TEXT;
