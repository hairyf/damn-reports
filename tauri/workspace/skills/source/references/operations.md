# /source 操作

本文定义高层 `/source` 操作及如何使用工作区工具实现：

- `read`
- `write`
- `edit`
- `grep`

所有路径和示例假设你在 App Workspace 中操作。

## 路径与工具

- `sources.json` 逻辑路径：
  - 仓库位置：`./sources.json`。
  - 对 `read`、`write`、`edit`、`grep`：使用 `path: "sources.json"`。

- 工具：
  - `read` – 加载当前 JSON 文本。
  - `write` – 用新内容覆盖文件。
  - `edit` – 受控的小范围文本替换。
  - `grep` – 定位模式（如特定 `id`）在文件中的位置。

## /source get_all

**目的**

返回完整的 `sources.json` 数组（所有数据源条目）。

**实现**

1. 调用 `read`：
   - 输入：`{"path": "sources.json"}`
2. 将返回字符串解析为 JSON。
3. 返回解析后的数组。
   - 元素为数据源定义，格式见 `schema.md`。

**注意**

- 本操作不修改数据；修改使用 `/source add` 或 `/source set`。

## /source add

**目的**

向 `sources.json` 添加新数据源条目。

**输入（概念）**

- `source`（object）– 符合 `schema.md` 的数据源定义，必须包含 `id`。
- 若省略 `enable`，默认为 `true`。
- 若省略 `createAt`/`updateAt`，设为当前 ISO 8601 时间。

**交互式添加时的必问项（不可遗漏）**

当用户请求添加数据源但未提供完整信息时，必须一次性或分步询问以下**全部**项，严禁只问 `params` 而忽略元信息：

1. **数据源元信息**（与 tool 无关，必须由用户或你推断）：
   - `name`：人类可读的名称（如「Damn Reports Git 仓库」）
   - `description`：该数据源的简短描述（如「读取本地 Git 仓库的提交与 diff」）

2. **采集参数**（`params`）：
   - 查阅 `tools.json` 中对应 tool 的 `definition`，按需询问每个参数的取值（如 `git_directory` 的 `repository`、`author` 等）

- 询问时请**同时**覆盖元信息与 params，不要只根据 tools.json 列出 tool 参数。
- `id`：无须用户未提供，从 `name` 或工具类型合理生成（如 `project_git_directory`）

**推荐实现（读–改–写）**

1. 调用 `/source get_all`（或直接 `read`）获取当前 JSON 文本。
   - `read` 输入：`{"path": "sources.json"}`
2. 将文本解析为数组 `sources`。
3. 检查是否存在相同 `id` 的条目：
   - 若存在，返回错误或“id 已存在”，不添加。
4. 为新数据源补全缺失的 `createAt` 和 `updateAt`。
5. 追加：`sources.push(source)`（或等效写法）。
6. 将 `sources` 序列化为 JSON 字符串（如可能，格式化输出）。
7. 调用 `write` 持久化：
   - 输入：`{"path": "sources.json", "content": "<序列化后的 sources>"}`
8. 可选：再次 `read` 并解析以确认新条目已存在。

**测试建议**

- 添加后，使用 **tool 技能** 的 `exec_tool` 运行一次采集，确认配置有效。
- 调用工作区工具 `exec_tool`，参数：
  - `toolid`：新数据源的 `tool` 字段（即 `tools.json` 中的 tool id）；
  - `params`：新数据源的 `params` 对象（与工具的 `definition` 对应）。
- 即将 `source.params` 作为 `exec_tool` 的 `params` 参数，执行一次采集以验证配置。

**使用 edit 做定向插入（可选）**

仅当能确定唯一、稳定的可替换子串时：

1. 使用 `read` 获取 `sources.json` 的**确切**当前文本。
2. 构建 `oldContent`（如 closing `]` 或最后一个数据源条目加逗号）。
3. 构建 `newContent`，将新数据源插入数组（注意逗号和合法 JSON）。
4. 调用 `edit`：
   - 输入：`{"path": "sources.json", "oldContent": "<旧>", "newContent": "<新>"}`
5. 可选：再次 `read` 并解析以验证文件仍为合法 JSON。

## /source get

**目的**

按 `id` 获取单个数据源。

**输入（概念）**

- `id`（string）– 要获取的数据源的 `id`。

**实现**

1. 调用 `read`：
   - 输入：`{"path": "sources.json"}`
2. 将文本解析为数组 `sources`。
3. 找到 `item.id === id` 的元素。
4. 返回：
   - 若找到，返回该数据源对象；
   - 若未找到，返回 `null` 或显式“未找到”响应。

**使用 grep 快速查找（可选）**

- 要快速定位文件中某 id 的原始片段，使用 `grep`：
  - 输入：`{"path": "sources.json", "pattern": "\"<id>\""}`
- 权威值仍应从解析后的 JSON 获取。

## /source set

**目的**

按 `id` 更新已有数据源。

**输入（概念）**

- `id`（string）– 要更新的数据源的 `id`。
- `source`（object）– 新的完整数据源定义（全量替换），或要合并的局部对象。

**推荐实现（读–改–写）**

1. 调用 `/source get_all`（或直接 `read`）加载当前 JSON。
2. 将文本解析为数组 `sources`。
3. 找到 `item.id === id` 的下标；若不存在，返回错误或“未找到”，避免误增。
4. 替换或合并：
   - **替换**：`sources[index] = source`（保持或统一设置 `id`）。
   - **合并**：`sources[index] = { ...sources[index], ...source }`，可选更新 `updateAt`。
5. 将 `sources` 序列化为 JSON 字符串。
6. 调用 `write`：
   - 输入：`{"path": "sources.json", "content": "<序列化后的 sources>"}`
7. 可选：调用 `/source get` 确认更新后的值。

**使用 edit 做小范围更新（可选）**

仅当修改很小且能精确定位片段时：

1. 使用 `read` 和/或 `grep` 定位确切的旧片段。
2. 构建 `oldContent` 和 `newContent`（必要时包含引号和逗号）。
3. 调用 `edit`：
   - 输入：`{"path": "sources.json", "oldContent": "<旧>", "newContent": "<新>"}`
4. 再次读取并解析 `sources.json` 以验证正确性。
