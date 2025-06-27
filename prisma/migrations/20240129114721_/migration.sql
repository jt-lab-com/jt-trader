-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Runtime" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "isRemoteStrategy" BOOLEAN NOT NULL DEFAULT false,
    "args" TEXT,
    "runtimeType" TEXT NOT NULL DEFAULT 'market',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Runtime" ("accountId", "args", "createdAt", "id", "name", "prefix", "runtimeType", "strategy", "updatedAt") SELECT "accountId", "args", "createdAt", "id", "name", "prefix", "runtimeType", "strategy", "updatedAt" FROM "Runtime";
DROP TABLE "Runtime";
ALTER TABLE "new_Runtime" RENAME TO "Runtime";
CREATE TABLE "new_Scenario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "isRemoteStrategy" BOOLEAN NOT NULL DEFAULT false,
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
INSERT INTO "new_Scenario" ("accountId", "args", "artifacts", "createdAt", "dynamicArgs", "end", "id", "name", "runtimeType", "start", "strategy", "symbol", "updatedAt") SELECT "accountId", "args", "artifacts", "createdAt", "dynamicArgs", "end", "id", "name", "runtimeType", "start", "strategy", "symbol", "updatedAt" FROM "Scenario";
DROP TABLE "Scenario";
ALTER TABLE "new_Scenario" RENAME TO "Scenario";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
