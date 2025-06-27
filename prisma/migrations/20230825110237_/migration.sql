/*
  Warnings:

  - Added the required column `prefix` to the `Runtime` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Runtime" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "args" TEXT,
    "runtimeType" TEXT NOT NULL DEFAULT 'market',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Runtime" ("args", "createdAt", "id", "name", "runtimeType", "strategy", "updatedAt") SELECT "args", "createdAt", "id", "name", "runtimeType", "strategy", "updatedAt" FROM "Runtime";
DROP TABLE "Runtime";
ALTER TABLE "new_Runtime" RENAME TO "Runtime";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
