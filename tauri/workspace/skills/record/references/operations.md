# /record 操作

本文定义 `/record` 的三类操作及实现方式，使用 workspace 工具：

- `exec_sql`
- `sync_records`

所有路径与示例均假定在 Tauri workspace 中操作。

## /record get

**目的**

使用 SQL 查询 `record` 表。

**输入（概念）**

- `sql`（string）– SELECT 语句，或用户提供的查询条件。

**实现**

1. 调用 `exec_sql`：
   - 输入: `{"sql": "<SELECT 语句>"}`

2. 根据用户意图构建 SQL，例如：
   - 最近 N 条: `SELECT * FROM record ORDER BY createdAt DESC LIMIT N`
   - 按 source: `SELECT * FROM record WHERE source = ? ORDER BY createdAt DESC`
   - 自由查询: 用户给出条件，组装成合法 SELECT。

3. 将 `exec_sql` 的返回结果原样返回。

**示例**

```text
用户: /record get 最近 5 条
→ exec_sql({ "sql": "SELECT * FROM record ORDER BY createdAt DESC LIMIT 5" })
```

## /record sync

**目的**

调用 `sync_records` 同步采集数据（执行 tools.json 中配置的采集流程）。

**实现**

1. 调用 `sync_records`：
   - 输入: `{}`

2. 将工具返回结果（采集数量等）转述给用户。

**示例**

```text
用户: /record sync
→ sync_records({})
```

## /record add

**目的**

向 `record` 表插入一条记录，`tool` 固定为 `"ai"`。

**输入（概念）**

- `id`（string）– 主键，需唯一
- `summary`（string）– 摘要
- `data`（object/any）– 数据，会序列化为 JSON 存入 `data` 列
- `source`（string）– 数据源

**实现**

1. 构造 INSERT 语句：
   - `tool` 必须为 `"ai"`
   - `id`、`summary`、`data`、`source` 由用户或上下文提供
   - `data` 需序列化为 JSON 字符串，SQL 中正确转义单引号

2. 调用 `exec_sql`：
   - 输入: `{"sql": "<INSERT 语句>"}`

3. 示例 SQL（SQLite 使用 `datetime('now')` 填充时间戳）：

```sql
INSERT INTO record (id, summary, data, source, tool, createdAt, updatedAt)
VALUES (
  'unique-id-123',
  '摘要内容',
  '{"key": "value"}',
  'manual',
  'ai',
  datetime('now'),
  datetime('now')
);
```

**注意事项**

- `id` 需在业务内唯一，如使用 `crypto.randomUUID()` 或时间戳+随机后缀
- `data` 为 JSON：`JSON.stringify(data)` 后，在 SQL 中单引号需转义为 `''`
- 或使用 `json()`：`json('{"key":"value"}')` 生成合法 JSON 文本
