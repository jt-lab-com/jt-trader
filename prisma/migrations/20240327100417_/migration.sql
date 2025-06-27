/*
  Warnings:

  - You are about to drop the column `symbol` on the `Scenario` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Scenario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL DEFAULT '',
    "strategyType" TEXT NOT NULL DEFAULT 'local',
    "artifacts" TEXT,
    "runtimeType" TEXT NOT NULL DEFAULT 'market',
    "start" TEXT NOT NULL,
    "end" TEXT NOT NULL,
    "args" TEXT,
    "dynamicArgs" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Scenario" ("accountId", "args", "artifacts", "createdAt", "dynamicArgs", "end", "id", "name", "runtimeType", "start", "strategy", "strategyId", "strategyType", "updatedAt") SELECT "accountId", "args", "artifacts", "createdAt", "dynamicArgs", "end", "id", "name", "runtimeType", "start", "strategy", "strategyId", "strategyType", "updatedAt" FROM "Scenario";
DROP TABLE "Scenario";
ALTER TABLE "new_Scenario" RENAME TO "Scenario";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
