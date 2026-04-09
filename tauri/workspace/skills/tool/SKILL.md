---
name: tool
description: "Manage App Workspace collector tools defined in tool.json: read all tools, add or update a single tool definition, inspect a single tool, and execute a tool via exec_tool. Use when you need to maintain or run collectors stored in tool.json in the App Workspace."
---

# 工具技能

本技能描述如何管理 App Workspace 中 `tool.json` 里存储的**采集工具**，以及如何通过 `exec_tool` 运行时工具执行它们。

目标：提供一致的指令用于

- 从 `tool.json` 读取所有工具定义
- 添加新工具
- 按 id 获取单个工具
- 更新已有工具
- 通过 `exec_tool` 桥接执行工具

## 文件与结构

- `tool.json`：根结构为 **JSON 对象**，键为 **tool id**，值为工具定义。
  - 在仓库中位于 `./tool.json`。
  - 使用工具（read、write、edit）时，应使用 `path: "tool.json"`。
- **单个工具格式**：见 `references/schema.md`。
- **高层操作**（`/tool get_all`、`/tool add`、`/tool get`、`/tool set`、`/tool exec`）：见 `references/operations.md`。

## 使用的工具和技能

- 工具：`read` `write` `edit` `grep` `exec_tool`
- `tool.json` 中的动态表达式统一使用 **JavaScript 表达式**。

## 使用方式

1. **理解 Schema**
   - 打开 `references/schema.md` 查看 `tool.json` 结构和单个工具定义。
   - 确保任何新增或更新的工具符合该格式。

2. **按操作指令执行**
   - 具体流程见 `references/operations.md`，定义：
     - `/tool get_all` – 读取并返回所有工具
     - `/tool add` – 插入新工具
     - `/tool get` – 按 id 获取单个工具
     - `/tool set` – 更新已有工具
     - `/tool exec` – 通过 `exec_tool` 执行工具

3. **正确使用 JavaScript 表达式**
   - `transformer` 字段也使用 **JavaScript 表达式**执行。
   - 表达式执行时，**只提供一个变量：`$data`**。
   - 不要依赖其他注入变量、辅助函数或旧语法约定。
   - 示例：

```js
$data.tasks.map(task => ({
  id: `${task.id}-${task.date_updated}`,
  summary: task.name,
  createdAt: Number(task.date_updated),
  data: task,
}))
```

   - 确保 `transformer` 始终返回规范格式：
     - 单个对象，或
     - 对象数组
   - 每个对象至少包含：`summary: string`、`createdAt: number`、`data: any`。

4. **保持 tool.json 结构清晰**
   - 始终将 `tool.json` 视为以 tool id 为键的 **JSON 对象**。
   - 添加或更新工具时，优先：
     - 解析现有 JSON
     - 在结构上修改
     - 再通过 `write` 写回格式化后的 JSON 字符串。
   - 仅当你知道确切的前后内容时，用 `edit` 做小幅、受控的文本替换。

详细步骤见 `references/operations.md`。

## 执行器复杂度：优先 Node 脚本

当工具的执行逻辑较为复杂时，**优先编写 Node.js 执行文件**，而非在 `tool.json` 中嵌入复杂 shell 命令、长参数链或过长的 JavaScript 表达式。

**何时使用 Node 脚本：**
- 逻辑涉及多步骤、分支或数据解析
- 复杂参数处理或校验
- 输出需在 transformer 运行前整理为 JSON
- Shell 转义或跨平台考虑使长命令易出错
- 表达式已经长到难以阅读或调试

**做法：**
1. 在 `tools/` 下创建脚本（如 `tools/my_collector.js`）
2. 通过 `process.argv` 或 `process.env` 接收参数，输出 JSON 到 stdout
3. 在 `tool.json` 中注册工具，`type: "exec"`，且：
   - `executor.command`: `"node"`
   - `executor.args`: `["./tools/my_collector.js", "{{param1}}", "{{param2}}"]`
4. 将脚本路径加入 `files` 数组，以便打包工作区时包含

**示例**（参见 `tool.json` 中的 `test_nodejs`）：

```json
{
  "my_tool": {
    "type": "exec",
    "files": ["tools/my_collector.js"],
    "executor": {
      "command": "node",
      "args": ["./tools/my_collector.js", "{{someParam}}"]
    },
    "transformer": "$data"
  }
}
```

这样可保持 `tool.json` 的声明式风格，复杂逻辑更易开发、测试和维护。
