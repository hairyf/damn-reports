# /tool 操作

本文定义高层 `/tool` 操作及如何使用工作区工具实现：

- `read`
- `write`
- `edit`
- `grep`
- `exec_tool`

所有路径和示例假设你在 App Workspace 中操作。

## 路径与工具

**避免重复读取**：读-改-写流程中，同一操作只需读取一次；若上一步已解析 `tools.json`，下一步直接复用解析结果，勿再次 `read`。执行 `exec_tool` 时，若本回合已读取过 `tools.json`，可直接调用，无需预校验。

- `tools.json` 逻辑路径：
  - 仓库位置：`./tools.json`。
  - 对 `read`、`write`、`edit`、`grep`：使用 `path: "tools.json"`（这些工具内部会加 `workspace` 前缀；见 `src/utils/fs-extra.ts`）。

- 辅助工具：
  - `read` – 以文本形式加载当前 JSON 内容。
  - `write` – 用新内容覆盖文件。
  - `edit` – 受控的小范围文本替换。
  - `grep` – 在原始文件中定位模式（如特定 `toolid`）。
  - `exec_tool` – 通过运行时执行层按 id 执行工具。

## /tool get_all

**目的**

返回完整的 `tools.json` 对象（所有采集器）。

**实现**

1. 调用 `read`：
   - 输入：`{"path": "tools.json"}`

2. 将返回字符串解析为 JSON。

3. 直接返回解析后的对象。
   - 键为 tool id。
   - 值为工具定义（见 `schema.md`）。

**注意**

- 本操作不修改结果。
- 修改请使用 `/tool add` 或 `/tool set`。

## /tool add

**目的**

在给定 tool id 下添加新工具定义。

**执行器策略**

- **简单**逻辑（单命令、少参数、输出直接）：使用内联 `executor`，配 `command` 和 `args`。
- **复杂**逻辑（多步骤、分支、解析、JSON 整形）：优先在 `tools/` 下编写 Node.js 脚本，然后通过 `executor.command: "node"` 和 `executor.args: ["./tools/script.js", ...]` 引用。将脚本加入 `files`。见 SKILL.md 中“执行器复杂度：优先 Node 脚本”一节。

**输入（概念）**

- `toolid`（string）– 工具将存储在其下的键。
- `tool`（object）– 符合 `schema.md` 中 schema 的工具定义。

**推荐实现（读–改–写）**

1. 调用 `/tool get_all`（或直接 `read`）加载当前 JSON：
   - `read` 输入：`{"path": "tools.json"}`

2. 将文本解析为 JSON 对象 `tools`。

3. 设置新工具：
   - `tools[toolid] = tool`

4. 将 `tools` 序列化回 JSON 字符串（如可能，格式化输出）。

5. 调用 `write` 持久化：
   - 输入：`{"path": "tools.json", "content": "<序列化后的 tools>"}`

6. 验证：通常无需再次 `read`；写入后即可认为成功。

**使用 edit 做定向插入（可选）**

当希望最小化 diff 时，可做小幅修改：

1. 使用 `read` 获取 `tools.json` 的**确切**当前文本。
2. 构建要替换的稳定子串 `oldContent`（如 closing `}` 或已知尾部条目）。
3. 构建 `newContent`，将新工具定义插入对象。
4. 调用 `edit`：
   - 输入：`{"path": "tools.json", "oldContent": "<旧>", "newContent": "<新>"}`

5. 验证：通常无需再次 `read`；仅在异常或用户要求确认时再读取。

仅当你确信 `oldContent` 子串唯一且稳定时使用 `edit` 方式。

## /tool get

**目的**

按 id 获取单个工具定义。

**输入（概念）**

- `toolid`（string）– 所需工具的键。

**实现**

1. 调用 `read`：
   - 输入：`{"path": "tools.json"}`

2. 将文本解析为 JSON 对象 `tools`。

3. 返回：
   - 若存在，返回 `tools[toolid]`；
   - 若 id 缺失，返回 `null` 或显式“未找到”响应。

**使用 grep 快速检查（可选）**

- 要快速定位 tool id 在文件中的原始文本，使用 `grep`：
  - 输入：`{"path": "tools.json", "pattern": "\"<toolid>\""}`

- 可选参数：`literal`（pattern 含正则特殊字符时按字面量匹配）、`context`（显示匹配行前后行数）、`limit`、`glob`（path 为目录时过滤文件如 `*.json`）。

- 这对编辑前了解上下文有帮助，但权威值仍应从解析后的 JSON 获取。

## /tool set

**目的**

按 id 更新已有工具定义。

**输入（概念）**

- `toolid`（string）– 要更新的工具的键。
- `tool`（object）– 新的完整工具定义（全量替换），或要合并到现有定义的局部对象。

**推荐实现（读–改–写）**

1. 调用 `/tool get_all`（或直接 `read`）加载当前 JSON。
2. 将文本解析为 JSON 对象 `tools`。
3. 校验 `tools[toolid]` 存在（若要避免误增）。
4. 替换或合并：
   - **替换**：`tools[toolid] = tool`
   - **合并**：`tools[toolid] = { ...tools[toolid], ...tool }`

5. 将 `tools` 序列化回 JSON 字符串。
6. 调用 `write`：
   - 输入：`{"path": "tools.json", "content": "<序列化后的 tools>"}`

7. 验证：通常无需再次 `read`；写入后即可认为成功。

**使用 edit 做小范围更新（可选）**

仅当修改很小且已知（如更新 description 或单个 JSONata transformer 字符串）时：

1. 使用 `read` 和/或 `grep` 定位确切旧片段。
2. 构建包含要替换的精确文本的 `oldContent` 和 `newContent`（含引号等）。
3. 调用 `edit`：
   - 输入：`{"path": "tools.json", "oldContent": "<旧>", "newContent": "<新>"}`

4. 验证：通常无需再次 `read`；仅在异常或用户要求确认时再读取。

## /tool exec

**目的**

使用运行时 `exec_tool` 桥接执行 `tools.json` 中定义的工具。

**输入（概念）**

- `toolid`（string）– 要执行的工具的 id。
- `params`（object，可选）– 工具参数的键值对，由工具的 `definition` 字段定义。

**实现**

1. 校验工具存在（可选；通常可省略）：
   - 若本回合**已读取过** `tools.json`，直接复用该结果，无需再次 `read`。
   - 若未读取过且需预校验，可调用 `/tool get`；若已确认 `toolid` 存在（如来自刚添加的 source），**跳过此步**，直接调用 `exec_tool`。
   - `exec_tool` 失败时会返回详细错误（含可用 tool id 列表），足以诊断问题。

2. 调用工作区工具 `exec_tool`：
   - 输入：`{"toolid": "<toolid>", "params": { /* 参数值 */ }}`

3. `exec_tool` 会：
   - 读取 `tools.json`。
   - 按 `toolid` 定位工具。
   - 执行底层 `executor`：
     - `"exec"` 类型：执行命令。
     - `"http"` 类型：发起 HTTP 请求。
   - 应用 JSONata `transformer` 规范化输出。

4. 将 `exec_tool` 的返回作为 `/tool exec` 的响应返回。

**结果格式**

- 应已符合工具的 `transformer` 定义的规范结构：
  - 单个对象或对象数组。
  - 每个对象至少包含：
    - `summary` – 简短描述。
    - `createdAt` – 毫秒级时间戳。
    - `data` – 原始或结构化数据载荷。

**错误处理**

- `exec_tool` 失败时会返回详细错误信息，包括：
  - 工具 id 与名称
  - 工具类型（`exec` / `http`）
  - 提供的参数
  - 底层错误信息（命令失败、transformer 失败等）
- 对 `exec` 类型：命令失败时错误会包含退出码、stderr、stdout。
- transformer 失败时，错误会包含原始输出预览和失败的 JSONata 表达式。
- 若在 `tools.json` 中未找到工具，错误会列出所有可用 tool id。
- 若缺少必需参数，错误会列出缺失参数及其描述。

**常见问题排查**

- **UTF-8 编码错误**（Windows）：exec 层会设置 `chcp 65001`、`$OutputEncoding`、`[Console]::OutputEncoding`、`[Console]::InputEncoding` 为 UTF-8。若仍有编码问题，检查工具的輸出是否包含系统区域设置带来的非 UTF-8 字符。
- **路径未找到**：确保 `executor.args` 中的路径相对于工作区根目录（如 `./tools/script.js`，而非 `./tool/script.js`）。同时确保 `files` 数组与实际路径一致。
- **命令未找到**：exec 层在 Windows 使用 PowerShell，在 Unix 使用 sh。确保命令在系统 PATH 中可用。

**使用 JSONata**

- 调整工具的 `transformer` 时：
  - 使用 `jsonata` 技能查阅语言细节和模式。
  - 确保最终表达式始终产出上述规范结构。
