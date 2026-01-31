-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'draft';

-- CreateIndex
CREATE INDEX "Page_status_idx" ON "Page"("status");

-- CreateIndex
CREATE INDEX "Page_createdAt_idx" ON "Page"("createdAt");
