-- AlterTable
ALTER TABLE "Runtime" ADD COLUMN "strategyPath" TEXT;

UPDATE Runtime
SET strategyPath = strategy || '.ts'
WHERE strategyType = 'local' AND strategyPath IS NULL;