# report 表结构

`report` 表存储日报等报告内容，对应 Prisma schema 中的 `Report` model。

## SQLite Schema

| 列名 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| name | TEXT | 报告名称 |
| type | TEXT | 报告类型（如 `daily`） |
| content | TEXT | 报告正文，支持 Markdown |
| createdAt | TEXT | 创建时间，ISO 8601 |
| updatedAt | TEXT | 更新时间，ISO 8601 |

## 常见查询示例

```sql
-- 当天报告（优先）
SELECT * FROM report
WHERE DATE(createdAt) = DATE('now')
ORDER BY createdAt DESC;

-- 最近 10 条
SELECT * FROM report ORDER BY createdAt DESC LIMIT 10;

-- 按 type 筛选
SELECT * FROM report WHERE type = 'daily' ORDER BY createdAt DESC;

-- 按 id 查询单条
SELECT * FROM report WHERE id = 1;
```
