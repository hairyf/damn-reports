---
name: record
description: "Query, sync, and insert records in the Record table. Use when you need to: run SQL queries on record, sync records via sync_records, or add new records with tool='ai'. Use for /record get, /record sync, /record add."
---

# 记录技能

本技能描述如何对 `record` 表进行增删改查，以及如何调用 `sync_records` 同步采集数据。

目标：提供一致的指令用于

- `/record get` – 使用 SQL 查询 record 表
- `/record sync` – 调用 sync_records 工具同步采集
- `/record add` – 使用 SQL 插入记录，tool 固定为 `"ai"`

## 文件与结构

- **表名**: `record`（Prisma @@map）
- **Schema 详情**: 见 `references/schema.md`
- **操作指令**: 见 `references/operations.md`

## 使用的工具

- `exec_sql` `sync_records`

## 使用方式

1. **理解 Schema**  
   - 打开 `references/schema.md` 了解 record 表结构与字段类型。

2. **按操作指令执行**  
   - 具体流程见 `references/operations.md`，定义：
     - `/record get` – SQL 查询
     - `/record sync` – 调用 sync_records
     - `/record add` – INSERT，tool 固定为 `"ai"`

3. **SQL 注意点**  
   - SQLite 中 `data` 为 JSON 字符串，INSERT 时需用 `'...'` 包裹，内部双引号需转义。  
   - 或使用 `json()` 函数构造 JSON。

详细步骤见 `references/operations.md`。
