# cron.json 与单个任务格式

本文描述 `cron.json` 的顶层结构及单个定时任务条目的预期格式。

## cron.json 顶层结构

- 文件 `cron.json` 为 **JSON 对象**，包含两个字段：
  - `version`（number）：固定为 `1`。
  - `jobs`（array）：定时任务数组。

示例（简化）：

```json
{
  "version": 1,
  "jobs": [
    {
      "id": "builtin_daily_report",
      "name": "每日报告生成",
      "description": "在设定时间自动收集数据并生成日报",
      "enabled": true,
      "schedule": { "kind": "workday", "time": "18:00", "region": "CN" },
      "payload": { "kind": "report" },
      "state": {},
      "createdAtMs": 1739000000000,
      "updatedAtMs": 1739000000000
    }
  ]
}
```

## 单个任务定义

每个任务包含以下字段。添加时**必填**：`id`、`name`、`enabled`、`schedule`、`payload`。

- `id`（string）
  - 唯一标识符。建议格式：`cron_<timestamp>_<random8>`。
  - 内置任务使用 `builtin_` 前缀。

- `name`（string）
  - 人类可读名称。

- `description`（string，可选）
  - 任务的简短描述。

- `enabled`（boolean）
  - 是否启用。为 `false` 时不会被调度执行。

- `deleteAfterRun`（boolean，可选）
  - 仅对 `at` 类型有效。为 `true` 时，一次性任务成功后自动删除。

- `schedule`（object）
  - 调度配置，五种类型之一：

  **工作日（含调休补班）**：
  ```json
  { "kind": "workday", "time": "18:00", "region": "CN" }
  ```
  - `time`：每日执行时刻，格式 `HH:mm`。
  - `region`（可选）：地区码，用于节假日/工作日判定。`CN` 使用国务院节假日数据（含补班），`JP` 使用日本祝日。默认 `CN`。

  **cron 表达式**：
  ```json
  { "kind": "cron", "expr": "0 18 * * 1-5", "tz": "Asia/Shanghai" }
  ```
  - `expr`：标准 cron 表达式（分 时 日 月 周）。
  - `tz`（可选）：时区，默认系统时区。

  **固定间隔**：
  ```json
  { "kind": "every", "everyMs": 3600000, "anchorMs": 1739000000000 }
  ```
  - `everyMs`：间隔毫秒数。
  - `anchorMs`（可选）：锚点时间戳。

  **一次性**：
  ```json
  { "kind": "at", "at": "2026-03-01T10:00:00Z" }
  ```
  - `at`：ISO 8601 时间字符串。

  **日报生成后**（report-end，事件驱动）：
  ```json
  { "kind": "report-end", "trigger": "every", "command": "node tools/script.js" }
  ```
  - `trigger`：`every` = 每次日报生成后执行；`scheduled` = 仅定时任务触发时报生成后执行
  - `command`：执行命令，最终以报告文件路径为参数调用：`{command} "<reportPath>"`
  - 无 `nextRunAtMs`，由日报生成事件触发

- `payload`（object）
  - 执行动作，五种类型之一：

  **收集数据**：
  ```json
  { "kind": "collect" }
  ```

  **生成报告**：
  ```json
  { "kind": "report" }
  ```

  **AI 对话**（发送消息到主会话）：
  ```json
  { "kind": "agentTurn", "message": "储存今天的记忆" }
  ```

  **执行命令**：
  ```json
  { "kind": "command", "command": "node ./tools/my_script.js" }
  ```

  **日报生成后执行**（配合 schedule.kind = report-end）：
  ```json
  { "kind": "reportEnd" }
  ```
  - 固定为 `reportEnd`，命令由 `schedule.command` 指定
  - 执行时：报告写入临时文件，以文件路径为参数调用 `schedule.command`

- `state`（object）
  - 运行时状态，由调度器自动管理。添加时设为 `{}`。
  - 包含：`nextRunAtMs`、`lastRunAtMs`、`lastStatus`、`lastError`、`lastDurationMs`、`consecutiveErrors`。
  - **不要手动修改 state**，除非需要重置错误计数。

- `createdAtMs`（number）
  - 创建时间戳（毫秒）。

- `updatedAtMs`（number）
  - 最后更新时间戳（毫秒）。

## 常用调度参考

| 类型 | 示例 | 含义 |
|------|------|------|
| workday | `{ "kind": "workday", "time": "18:00", "region": "CN" }` | 国内工作日 18:00（含调休补班） |
| cron | `0 18 * * 1-5` | 周一到周五 18:00（纯 cron，不含补班） |
| cron | `0 0 * * *` | 每天零点 |
| cron | `*/30 * * * *` | 每 30 分钟 |
| cron | `0 9,18 * * *` | 每天 9:00 和 18:00 |
| cron | `0 0 * * 1` | 每周一零点 |
| cron | `0 0 1 * *` | 每月 1 号零点 |

## report-end 调度说明

| trigger | 含义 |
|---------|------|
| `every` | 任意日报生成后执行（含手动、定时） |
| `scheduled` | 仅 builtin_daily_report 定时触发时执行 |

示例：`{"kind": "report-end", "trigger": "every", "command": "node tools/notify.js"}` → 日报生成后执行 `node tools/notify.js "<报告文件路径>"`，脚本可通过首个参数读取报告内容。

## 常用间隔参考

| 毫秒数 | 含义 |
|--------|------|
| `60000` | 1 分钟 |
| `300000` | 5 分钟 |
| `900000` | 15 分钟 |
| `1800000` | 30 分钟 |
| `3600000` | 1 小时 |
| `86400000` | 1 天 |
