# cron 操作

本文定义高层 cron 操作及如何使用工作区工具实现：

- `read`
- `write`
- `edit`
- `grep`

所有路径和示例假设你在 App Workspace 中操作。

## 路径与工具

- `cron.json` 逻辑路径：
  - 仓库位置：`./cron.json`。
  - 对 `read`、`write`、`edit`、`grep`：使用 `path: "cron.json"`。

- 工具：
  - `read` – 加载当前 JSON 文本。
  - `write` – 用新内容覆盖文件。**写入后调度器自动重新加载**。
  - `edit` – 受控的小范围文本替换。
  - `grep` – 定位模式（如特定 `id`）在文件中的位置。

**避免重复读取**：读-改-写流程中，同一操作只需读取一次；若上一步已解析 `cron.json`，下一步直接复用解析结果，勿再次 `read`。

## get_all

**目的**

返回完整的 `cron.json`（所有定时任务）。

**实现**

1. 调用 `read`：
   - 输入：`{"path": "cron.json"}`
2. 将返回字符串解析为 JSON。
3. 返回 `jobs` 数组。

## add

**目的**

向 `cron.json` 的 `jobs` 数组添加新定时任务。

**交互式添加时的必问项**

当用户请求添加定时任务但未提供完整信息时，必须询问：

1. **任务元信息**：
   - `name`：人类可读名称（如「每日数据收集」）
   - `description`：简短描述（可选）

2. **调度方式**（`schedule`）：
   - 类型：工作日（workday，含补班）/ cron 表达式 / 固定间隔 / 一次性 / 日报生成后（report-end）
   - 对应参数：workday 用 `time`、`region`；cron 用 `expr`、`tz`；every 用 `everyMs`；at 用 `at`；report-end 用 `trigger`（every / scheduled）、`command`

3. **执行动作**（`payload`）：
   - 类型：收集数据 / 生成报告 / 日报生成后执行 / AI 对话 / 执行命令
   - 对应参数（message / command）；report-end 时 payload 固定为 `{ kind: "reportEnd" }`

**推荐实现（读–改–写）**

1. 调用 `read`：`{"path": "cron.json"}`
2. 将文本解析为对象 `store`。
3. 检查 `store.jobs` 中是否存在相同 `id`：
   - 若存在，返回错误。
4. 生成 `id`：`cron_<Date.now()>_<random8>`。
5. 补全 `createdAtMs`、`updatedAtMs`（当前时间戳）、`state: {}`。
6. 追加：`store.jobs.push(newJob)`。
7. 调用 `write` 持久化：
   - 输入：`{"path": "cron.json", "content": "<序列化后的 store>"}`

## get

**目的**

按 `id` 获取单个任务。

**实现**

1. 调用 `read`：`{"path": "cron.json"}`
2. 解析为对象，在 `jobs` 数组中查找 `item.id === id`。
3. 返回找到的任务或"未找到"。

## set

**目的**

按 `id` 更新已有任务。

**推荐实现（读–改–写）**

1. 调用 `read` 加载当前 JSON。
2. 解析为对象 `store`。
3. 找到 `item.id === id` 的下标；若不存在，返回错误。
4. 合并更新字段：`store.jobs[index] = { ...store.jobs[index], ...patch, updatedAtMs: Date.now() }`。
5. 调用 `write` 持久化。

**使用 edit 做小范围更新（可选）**

仅当修改很小且能精确定位片段时（如修改 `enabled` 字段）：

1. 使用 `read` 获取确切文本。
2. 构建 `oldContent` 和 `newContent`。
3. 调用 `edit`。

## remove

**目的**

从 `cron.json` 中移除指定 `id` 的任务。

**实现**

1. 调用 `read`：`{"path": "cron.json"}`，解析为对象 `store`。
2. 过滤：`store.jobs = store.jobs.filter(item => item.id !== id)`。
3. 调用 `write` 持久化。

**注意**：`builtin_daily_report` 和 `builtin_memory_clear` 是内置任务，建议不要删除。
