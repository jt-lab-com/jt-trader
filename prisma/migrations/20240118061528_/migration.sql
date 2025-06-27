/*
  Warnings:

  - Added the required column `accountId` to the `Runtime` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountId` to the `Config` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountId` to the `Scenario` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Runtime" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "args" TEXT,
    "runtimeType" TEXT NOT NULL DEFAULT 'market',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Runtime" ("args", "createdAt", "id", "name", "prefix", "runtimeType", "strategy", "updatedAt") SELECT "args", "createdAt", "id", "name", "prefix", "runtimeType", "strategy", "updatedAt" FROM "Runtime";
DROP TABLE "Runtime";
ALTER TABLE "new_Runtime" RENAME TO "Runtime";
CREATE TABLE "new_Config" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Config" ("createdAt", "id", "name", "type", "updatedAt", "value") SELECT "createdAt", "id", "name", "type", "updatedAt", "value" FROM "Config";
DROP TABLE "Config";
ALTER TABLE "new_Config" RENAME TO "Config";
CREATE TABLE "new_Scenario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
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
INSERT INTO "new_Scenario" ("args", "artifacts", "createdAt", "dynamicArgs", "end", "id", "name", "runtimeType", "start", "strategy", "symbol", "updatedAt") SELECT "args", "artifacts", "createdAt", "dynamicArgs", "end", "id", "name", "runtimeType", "start", "strategy", "symbol", "updatedAt" FROM "Scenario";
DROP TABLE "Scenario";
ALTER TABLE "new_Scenario" RENAME TO "Scenario";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
