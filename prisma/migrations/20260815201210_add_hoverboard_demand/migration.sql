-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Hoverboard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "speed" REAL NOT NULL,
    "demand" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Hoverboard" ("createdAt", "description", "icon", "id", "name", "speed", "updatedAt") SELECT "createdAt", "description", "icon", "id", "name", "speed", "updatedAt" FROM "Hoverboard";
DROP TABLE "Hoverboard";
ALTER TABLE "new_Hoverboard" RENAME TO "Hoverboard";
CREATE UNIQUE INDEX "Hoverboard_name_key" ON "Hoverboard"("name");
CREATE INDEX "Hoverboard_name_idx" ON "Hoverboard"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
