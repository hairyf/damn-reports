-- Remove source table and change record.sourceId from Int to String

-- Recreate record table with sourceId as TEXT (SQLite does not support ALTER COLUMN type)
CREATE TABLE "record_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "summary" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sourceId" TEXT NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    CONSTRAINT "record_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "record_new" ("id", "summary", "data", "createdAt", "updatedAt", "sourceId", "workspaceId")
SELECT "id", "summary", "data", "createdAt", "updatedAt", CAST("sourceId" AS TEXT), "workspaceId" FROM "record";

DROP TABLE "record";

ALTER TABLE "record_new" RENAME TO "record";

DROP TABLE "source";
