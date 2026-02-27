# source.json 与单个数据源格式

本文描述 `source.json` 的顶层结构及单个数据源条目的预期格式。

## source.json 顶层结构

- 文件 `source.json` 为 **JSON 数组**。
- 每个元素为 **数据源定义对象**。
- 每个数据源由其 `id` 字段唯一标识。

示例（简化）：

```json
[
  {
    "id": "damn_reports_git_directory",
    "name": "Damn Reports Git Directory",
    "description": "Read Git commits and diffs from a local Git repository",
    "tool": "git_directory",
    "enable": true,
    "params": {
      "repository": "D:/damn-reports",
      "author": "hairyf"
    },
    "createdAt": "2026-02-12T00:00:00.000Z",
    "updatedAt": "2026-02-12T00:00:00.000Z"
  }
]
```

## 单个数据源定义

每个数据源定义包含以下字段。添加时**必填**：`id`、`name`、`description`、`tool`、`params`。

- `id`（string）
  - 唯一标识符；供 `/source get`、`/source set` 等使用。

- `name`（string）
  - 人类可读名称。

- `description`（string）
  - 数据源的简短描述。

- `tool`（string）
  - 关联的采集器类型（`tool.json` 中的 tool id）。

- `enable`（boolean，可选）
  - 是否启用此数据源。省略时默认为 `true`。
  - 为 `false` 时，采集时跳过该数据源。

- `params`（object）
  - 该数据源的参数；键由对应工具的 `definition` 决定。
  - 例如 `git_directory` 工具：`repository`、`author` 等。

- `createdAt`（string）
  - ISO 8601 时间戳，创建时间。

- `updatedAt`（string）
  - ISO 8601 时间戳，最后更新时间。

## 与 tool.json 的关系

- `source.tool` 引用 `tool.json` 中的 tool id。
- `source.params` 的字段应与该工具的 `definition` 参数对应，执行时用于填充 `executor` 中的 `{{...}}` 占位符。
