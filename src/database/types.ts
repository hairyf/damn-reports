import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type Record = {
    id: string;
    summary: string;
    data: unknown;
    createdAt: Generated<string>;
    updatedAt: string;
    source: string;
    tool: string;
    workspaceId: number;
};
export type Report = {
    id: Generated<number>;
    name: string;
    type: string;
    content: string;
    createdAt: Generated<string>;
    updatedAt: string;
    workspaceId: number;
};
export type Workspace = {
    id: Generated<number>;
    workflow: string;
    name: string;
};
export type DB = {
    record: Record;
    report: Report;
    workspace: Workspace;
};
