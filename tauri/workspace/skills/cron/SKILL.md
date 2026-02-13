---
name: cron
description: "管理 crons.json 中的定时任务（Hooks）：列出、添加、查询、更新、删除。使用 read/write/edit 操作 crons.json。"
---

# 定时任务（Hooks）技能

本技能描述如何管理存储在 App Workspace 中 `crons.json` 的**定时任务**，以及列出、添加、查询、更新、删除的标准流程。

目标：提供一致的指令用于

- 从 `crons.json` 读取所有定时任务（get_all）
- 添加新定时任务（add）
- 按 id 获取单个任务（get）
- 更新已有任务（set）
- 删除任务（remove）

所有指令假设你在 App Workspace 上下文中操作。

## 文件与结构

- `crons.json`：根结构为 **JSON 对象**，包含 `version` 和 `jobs` 数组。
  - 在仓库中位于 `./crons.json`。
  - 使用工具（read、write、edit）时，路径为 `path: "crons.json"`。
- **单个任务格式**：见 `references/schema.md`。
- **高层操作**（get_all、add、get、set、remove）：见 `references/operations.md`。

## 使用的工具

- `read`
  - 读取工作区下的文本文件。
  - 使用 `{"path": "crons.json"}` 读取当前任务列表。

- `write`
  - 创建或覆盖工作区下的文件。
  - 使用 `{"path": "crons.json", "content": "<更新后的 JSON>"}` 持久化更改。
  - **写入后应用会自动重新加载 cron 调度器**。

- `edit`
  - 对文件进行简单文本替换。
  - 适用于较小、精确的更新（如修改单个字段）。

- `grep`
  - 在文件中搜索字符串模式。
  - 路径约定与 `read`/`write`/`edit` 相同。

## 使用方式

1. **理解 Schema**
   - 打开 `references/schema.md` 查看 `crons.json` 结构和单个任务定义。

2. **按操作指令执行**
   - 具体流程见 `references/operations.md`，定义：
     - get_all – 读取并返回所有任务
     - add – 添加新定时任务（**交互时必问 name、schedule、payload**）
     - get – 按 id 获取单个任务
     - set – 按 id 更新已有任务
     - remove – 按 id 删除任务

3. **保持 crons.json 有效**
   - 始终将 `crons.json` 视为 `{ version: 1, jobs: [...] }` 结构。
   - 添加或更新时：读取并解析，在内存中修改，然后序列化并通过 `write` 写回。
   - 仅在较小、位置明确的修改时使用 `edit`。

4. **内置任务**
   - `builtin_daily_report` 和 `builtin_memory_clear` 是系统预置任务。
   - 可以编辑但建议不要删除。

详细步骤见 `references/operations.md`。
