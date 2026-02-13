# /report 操作

本文定义 `/report` 的三类操作及实现方式：

- `exec_sql`
- `generate_report`

## /report get

**目的**

使用 SQL 查询 `report` 表，**优先当天**数据。

**输入（概念）**

- `sql`（string）– SELECT 语句，或用户提供的查询条件。

**实现**

1. 若用户未指定具体查询，默认优先查询**当天**报告：
   - `SELECT * FROM report WHERE DATE(createdAt) = DATE('now') ORDER BY createdAt DESC`

2. 若用户指定了条件（如“最近 5 条”“按 type 查”），按其意图构建 SQL。

3. 调用 `exec_sql`：
   - 输入: `{"sql": "<SELECT 语句>"}`

4. 将 `exec_sql` 的返回结果原样返回。

**示例**

```text
用户: /report get
→ exec_sql({ "sql": "SELECT * FROM report WHERE DATE(createdAt) = DATE('now') ORDER BY createdAt DESC" })

用户: /report get 最近 5 条
→ exec_sql({ "sql": "SELECT * FROM report ORDER BY createdAt DESC LIMIT 5" })
```

## /report generate

**目的**

调用 `generate_report` 同步记录并生成、保存当天的日报。

**实现**

1. 调用 `generate_report`：
   - 输入: `{}`

2. 将工具返回结果（生成状态、报告内容等）转述给用户。

**示例**

```text
用户: /report generate
→ generate_report({})
```

## /report set

**目的**

使用 SQL 对 report 表进行**更改**：INSERT、UPDATE、DELETE。

**输入（概念）**

根据操作类型而定：
- **INSERT**: `name`, `type`, `content`
- **UPDATE**: `id` 或条件，以及要更新的字段（如 `content`, `name`, `type`）
- **DELETE**: `id` 或 WHERE 条件

**实现**

1. 根据用户意图构造相应的 SQL：
   - **INSERT**:
     ```sql
     INSERT INTO report (name, type, content, createdAt, updatedAt)
     VALUES ('报告名', 'daily', '...', datetime('now'), datetime('now'));
     ```
   - **UPDATE**:
     ```sql
     UPDATE report SET content = '...', updatedAt = datetime('now') WHERE id = 1;
     ```
   - **DELETE**:
     ```sql
     DELETE FROM report WHERE id = 1;
     ```

2. 调用 `exec_sql`：
   - 输入: `{"sql": "<SQL 语句>"}`

3. 将 `exec_sql` 的返回结果转述给用户。

**注意事项**

- `content` 为长文本，若包含单引号需转义为 `''`。
- UPDATE 时建议同时更新 `updatedAt = datetime('now')`。
