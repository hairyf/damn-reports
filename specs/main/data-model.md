# Data Model: Damn Daily Reports

**Phase 1 Output** | **Date**: 2025-02-15

## Entities

### Report

日报/周报/月报/年报实体。

| Field     | Type      | Constraints | Description        |
|-----------|-----------|-------------|--------------------|
| id        | number    | PK, auto    | 主键               |
| name      | string    | NOT NULL    | 报告标题           |
| type      | string    | NOT NULL    | daily \| weekly \| monthly \| yearly |
| content   | string    | NOT NULL    | Markdown 内容      |
| createdAt | timestamp | auto        | 创建时间           |
| updatedAt | string    | NOT NULL    | 更新时间           |

**Validation**:
- `type` ∈ { daily, weekly, monthly, yearly }
- `content` 可为空字符串，表示未完成

**State**: 创建后即可编辑；无发布/草稿状态（Constitution：用户控制，不自动发布）

---

### Record

来自外部数据源的工作记录。

| Field     | Type      | Constraints | Description        |
|-----------|-----------|-------------|--------------------|
| id        | string    | PK          | 源系统 ID 或 UUID   |
| summary   | string    | NOT NULL    | 摘要               |
| data      | JSON      |             | 原始数据           |
| source    | string    | NOT NULL    | 数据源 ID          |
| tool      | string    | NOT NULL    | 工具名（clickup, git 等）|
| createdAt | timestamp | auto        | 创建时间           |
| updatedAt | string    | NOT NULL    | 更新时间           |

**Relationships**:
- `source` 可关联到 sources 配置（非强约束）

**Validation**:
- `id` 在同一 tool 下唯一

---

### Workspace

工作空间（当前版本可能未充分使用）。

| Field    | Type   | Constraints | Description  |
|----------|--------|-------------|--------------|
| id       | number | PK, auto    | 主键         |
| workflow | string | NOT NULL    | 工作流标识   |
| name     | string | NOT NULL    | 名称         |

---

## Entity Relationship

```text
Workspace (1) ──┬── (0..*) Report   [可选，当前按 type 过滤]
               └── (0..*) Record   [通过 tool/source 间接关联]

Record 与 Report 无直接 FK：Report 生成时通过查询 Record 按时间/源聚合。
```

---

## State Transitions

### Report

- 创建 → 可编辑 → 保存（无“发布”状态）

### Record

- 同步创建/更新；无删除流程（可选：软删除或保留历史）
