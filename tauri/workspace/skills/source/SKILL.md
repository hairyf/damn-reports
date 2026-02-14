---
name: source
description: "Manage App Workspace data sources defined in sources.json: list all sources, add a new source, get a source by id, and update an existing source. Use when you need to maintain the list of collector sources (sources.json) in the App Workspace."
---

# 数据源技能

本技能描述如何管理存储在 App Workspace 中 `sources.json` 的**数据源**，以及列出、添加、查询、更新的标准流程。

目标：提供一致的指令用于

- 从 `sources.json` 读取所有数据源定义（get_all）
- 添加新数据源（add）
- 按 id 获取单个数据源（get）
- 更新已有数据源（set）

所有指令假设你在 App Workspace 上下文中操作。

## 文件与结构

- `sources.json`：根结构为** JSON 数组**，每个元素为数据源定义。
  - 在仓库中位于 `tauri/workspace/sources.json`。
  - 使用工作区工具（read、write、edit）时，路径为 `path: "sources.json"`。
- **单个数据源格式**：见 `references/schema.md`。
- **高层操作**（`/source get_all`、`/source add`、`/source get`、`/source set`、`/source remove`）：见 `references/operations.md`。

## 使用的工具

- `read` `write` `edit` `grep`

## 使用方式

1. **理解 Schema**
   - 打开 `references/schema.md` 查看 `sources.json` 结构和单个数据源定义。

2. **按操作指令执行**
   - 具体流程见 `references/operations.md`，定义：
     - `/source get_all` – 读取并返回所有数据源
     - `/source add` – 添加新数据源（**交互时必问 name、description 及 tool 的 params，不可只问 params**）
     - `/source get` – 按 id 获取单个数据源
     - `/source set` – 按 id 更新已有数据源

3. **添加后可选测试（仅限 exec_tool）**
   - 可选：加载 **tool 技能** 并调用 `exec_tool`，将数据源的 `tool` 作为 `toolid`，`params` 作为 `params`，验证采集能否成功。
   - **严禁**：添加数据源后擅自调用 `sync_records` 或 `generate_report`；除非用户明确请求同步或生成日报，否则仅完成添加/更新操作。

4. **保持 sources.json 有效**
   - 始终将 `sources.json` 视为 **JSON 数组**。
   - 添加或更新时：读取并解析，在内存中修改数组，然后序列化并通过 `write` 写回；仅在较小、位置明确的修改时使用 `edit`。

详细步骤见 `references/operations.md`。
