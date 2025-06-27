-- AlterTable
ALTER TABLE "Scenario" ADD COLUMN "strategyPath" TEXT;

UPDATE Scenario
SET strategyPath = strategy || '.ts'
WHERE strategyType = 'local' AND strategyPath IS NULL;

