# record 表结构

`record` 表存储从各数据源采集到的记录，对应 Prisma schema 中的 `Record` model。

## SQLite Schema

| 列名 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 主键，唯一标识 |
| summary | TEXT | 简短摘要 |
| data | TEXT | JSON 字符串，原始/结构化数据 |
| createdAt | TEXT | 创建时间，ISO 8601 |
| updatedAt | TEXT | 更新时间，ISO 8601 |
| source | TEXT | 数据源标识 |
| tool | TEXT | 采集工具标识 |
| workspaceId | INTEGER | 所属 workspace，FK |

## 关系

- `workspaceId` → `workspace.id`

## 常见查询示例

```sql
-- 按 workspace 查询最近 10 条
SELECT * FROM record WHERE workspaceId = 1 ORDER BY createdAt DESC LIMIT 10;

-- 按 source 筛选
SELECT * FROM record WHERE source = 'git_directory' ORDER BY createdAt DESC;

-- 按 tool 筛选
SELECT * FROM record WHERE tool = 'ai' ORDER BY createdAt DESC;
```
