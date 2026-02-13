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
- **高层操作**（`/source get_all`、`/source add`、`/source get`、`/source set`）：见 `references/operations.md`。

## 使用的工具

这些工具在 `src/config/tools.ts` 中定义并暴露给 agent：

- `read`
  - 读取工作区下的文本文件。
  - 内部会将给定路径与 `workspace` 目录拼接。
  - 使用 `{"path": "sources.json"}` 读取当前数据源列表。

- `write`
  - 创建或覆盖工作区下的文件。
  - 同样会与 `workspace` 拼接。
  - 使用 `{"path": "sources.json", "content": "<更新后的 JSON>"}` 持久化更改。

- `edit`
  - 对文件进行简单文本替换。
  - 适用于较小、精确的更新。

- `grep`
  - 在文件中搜索字符串模式。
  - 路径约定与 `read`/`write`/`edit` 相同：使用 `path: "sources.json"`。

## 使用方式

1. **理解 Schema**
   - 打开 `references/schema.md` 查看 `sources.json` 结构和单个数据源定义。

2. **按操作指令执行**
   - 具体流程见 `references/operations.md`，定义：
     - `/source get_all` – 读取并返回所有数据源
     - `/source add` – 添加新数据源
     - `/source get` – 按 id 获取单个数据源
     - `/source set` – 按 id 更新已有数据源

3. **添加后建议测试**
   - 加载 **tool 技能**（`skills/tool`）并调用 `exec_tool`：将数据源的 `tool` 作为 `toolid`，`source.params` 作为 `params`，运行一次采集以验证配置正确。

4. **保持 sources.json 有效**
   - 始终将 `sources.json` 视为 **JSON 数组**。
   - 添加或更新时：读取并解析，在内存中修改数组，然后序列化并通过 `write` 写回；仅在较小、位置明确的修改时使用 `edit`。

详细步骤见 `references/operations.md`。
