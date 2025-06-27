/*
  Warnings:

  - You are about to drop the column `isRemoteStrategy` on the `Runtime` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Runtime" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL DEFAULT '',
    "strategyType" TEXT NOT NULL DEFAULT 'local',
    "args" TEXT,
    "runtimeType" TEXT NOT NULL DEFAULT 'market',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Runtime" ("accountId", "args", "createdAt", "id", "name", "prefix", "runtimeType", "strategy", "strategyId", "strategyType", "updatedAt") SELECT "accountId", "args", "createdAt", "id", "name", "prefix", "runtimeType", "strategy", "strategyId", "strategyType", "updatedAt" FROM "Runtime";
DROP TABLE "Runtime";
ALTER TABLE "new_Runtime" RENAME TO "Runtime";
CREATE TABLE "new_Scenario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL DEFAULT '',
    "strategyType" TEXT NOT NULL DEFAULT 'local',
    "symbol" TEXT NOT NULL,
    "artifacts" TEXT,
    "runtimeType" TEXT NOT NULL DEFAULT 'market',
    "start" TEXT NOT NULL,
    "end" TEXT NOT NULL,
    "args" TEXT,
    "dynamicArgs" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Scenario" ("accountId", "args", "artifacts", "createdAt", "dynamicArgs", "end", "id", "name", "runtimeType", "start", "strategy", "strategyId", "strategyType", "symbol", "updatedAt") SELECT "accountId", "args", "artifacts", "createdAt", "dynamicArgs", "end", "id", "name", "runtimeType", "start", "strategy", "strategyId", "strategyType", "symbol", "updatedAt" FROM "Scenario";
DROP TABLE "Scenario";
ALTER TABLE "new_Scenario" RENAME TO "Scenario";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
