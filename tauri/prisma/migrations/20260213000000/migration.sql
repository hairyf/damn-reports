-- Remove workspace table and workspaceId from record and report

-- Recreate record table without workspaceId
CREATE TABLE "record_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "summary" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "source" TEXT NOT NULL,
    "tool" TEXT NOT NULL
);

INSERT INTO "record_new" ("id", "summary", "data", "createdAt", "updatedAt", "source", "tool")
SELECT "id", "summary", "data", "createdAt", "updatedAt", "source", "tool" FROM "record";

DROP TABLE "record";
ALTER TABLE "record_new" RENAME TO "record";

-- Recreate report table without workspaceId
CREATE TABLE "report_new" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "report_new" ("id", "name", "type", "content", "createdAt", "updatedAt")
SELECT "id", "name", "type", "content", "createdAt", "updatedAt" FROM "report";

DROP TABLE "report";
ALTER TABLE "report_new" RENAME TO "report";

-- Drop workspace table
DROP TABLE "workspace";
