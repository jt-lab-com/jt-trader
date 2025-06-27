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
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Scenario" ("accountId", "args", "artifacts", "createdAt", "dynamicArgs", "end", "id", "name", "runtimeType", "start", "strategy", "strategyId", "strategyType", "updatedAt") SELECT "accountId", "args", "artifacts", "createdAt", "dynamicArgs", "end", "id", "name", "runtimeType", "start", "strategy", "strategyId", "strategyType", "updatedAt" FROM "Scenario";
DROP TABLE "Scenario";
ALTER TABLE "new_Scenario" RENAME TO "Scenario";
CREATE TABLE "new_ScenarioSet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "scenarioId" INTEGER NOT NULL,
    "args" TEXT NOT NULL,
    "artifacts" TEXT,
    "status" INTEGER NOT NULL DEFAULT 0,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScenarioSet_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ScenarioSet" ("args", "artifacts", "createdAt", "id", "scenarioId", "status", "updatedAt") SELECT "args", "artifacts", "createdAt", "id", "scenarioId", "status", "updatedAt" FROM "ScenarioSet";
DROP TABLE "ScenarioSet";
ALTER TABLE "new_ScenarioSet" RENAME TO "ScenarioSet";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
