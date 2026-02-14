---
name: report
description: "Query, generate, and update reports in the Report table. Use when you need to: run SQL queries on report (prefer same-day), generate today's report via generate_report, or modify reports with SQL. Use for /report get, /report generate, /report set."
---

# 报告技能

本技能描述如何对 `report` 表进行增删改查，以及如何调用 `generate_report` 生成当天日报。

目标：提供一致的指令用于

- `/report get` – 使用 SQL 查询 report 表，优先当天
- `/report generate` – 调用 generate_report 工具生成当天日报
- `/report set` – 使用 SQL 更改（INSERT/UPDATE/DELETE）

## 文件与结构

- **表名**: `report`（Prisma @@map）
- **Schema 详情**: 见 `references/schema.md`
- **操作指令**: 见 `references/operations.md`

## 使用的工具

- `exec_sql` `generate_report`

## 使用方式

1. **理解 Schema**
   - 打开 `references/schema.md` 了解 report 表结构与字段类型。

2. **按操作指令执行**
   - 具体流程见 `references/operations.md`，定义：
     - `/report get` – SQL 查询，优先当天
     - `/report generate` – 调用 generate_report
     - `/report set` – SQL 更改（INSERT/UPDATE/DELETE）

3. **SQL 注意点**
   - SQLite 中时间格式为 ISO 8601 字符串，可用 `datetime('now')` 获取当前时间。
   - `content` 为长文本，INSERT/UPDATE 时单引号需转义为 `''`。

详细步骤见 `references/operations.md`。
