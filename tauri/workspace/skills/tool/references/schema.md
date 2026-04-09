# tool.json 与单个工具格式

本文描述 `tool.json` 的结构及单个工具定义的预期格式。

## tool.json 顶层结构

- 文件 `tool.json` 为 **单个 JSON 对象**。
- 每个属性键为 **tool id**（string）。
- 每个属性值为 **工具定义对象**。

示例（简化）：

```json
{
  "git_directory": {
    "name": "Git Directory Reader",
    "description": "Read Git commits and diffs from a local Git repository",
    "type": "exec",
    "definition": {
      "repository": { "type": "string", "description": "The local Git repository path" },
      "author": { "type": "string", "description": "The author name to filter commits" }
    },
    "executor": {
      "command": "git",
      "args": ["-C", "{{repository}}", "log", "--since=midnight", "--format=%h%x09%s%x09%an%x09%at", "--author={{author}}"]
    },
    "transformer": "..."
  }
}
```

## 单个工具定义

每个工具定义包含以下字段：

- `name`（string）
  - 人类可读的工具名称。

- `description`（string）
  - 工具功能的简短描述。

- `type`（string）
  - 执行类型。
  - 当前支持：
    - `"exec"` – 执行系统命令（如 `git`、`node`）。
    - `"http"` – 发起 HTTP 请求。

- `definition`（object）
  - 工具参数的声明式定义。
  - 键为参数名。
  - 参数 schema：
    - `type`（string）– 如 `"string"`、`"number"`、`"boolean"`。
    - `description`（string）– 参数描述。
    - `optional`（boolean，可选）– 为 `true` 时参数可省略；省略时模板中使用空字符串。
    - `default`（any，可选）– 参数省略或为空时使用的值。
  - 若同时设置 `optional` 和 `default`，参数缺失时以 `default` 为准。

- `files`（可选，字符串数组）
  - 工具所需的额外文件（如辅助脚本）。
  - 路径相对于工作区资源根目录。
  - **复杂执行器**：优先在 `tools/` 下添加 Node 脚本并在此列出；使用 `executor.command: "node"` 和 `executor.args: ["./tools/script.js", ...]`。

- `dependencies`（可选，对象）
  - npm 依赖，与 workspace 根目录 `package.json` 的 `dependencies` 格式一致，键为包名，值为版本（如 `"^1.0.0"`）。导入 `.tool` 后若存在此字段，会在工作区自动执行 `pnpm install` 或 `npm install` 安装这些依赖。

- `executor`（object）
  - 如何调用底层系统或 HTTP 层。
  - 结构随 `type` 不同：

  `"exec"` 类型：

  ```json
  {
    "command": "git",
    "args": ["-C", "{{repository}}", "log", "..."]
  }
  ```

  `"http"` 类型：

  ```json
  {
    "baseUrl": "https://api.example.com",
    "method": "GET",
    "path": "/resource/{{id}}",
    "headers": {
      "Authorization": "{{token}}"
    },
    "query": {
      "param": "{{value}}"
    },
    "body": {
      "field": "{{payload}}"
    }
  }
  ```

  - `{{...}}` 占位符在执行时由工具参数解析。
  - 若某个字符串值以 `$` 开头，则会作为 **JavaScript 表达式**执行。
  - 执行表达式时，**只提供一个变量：`$data`**。

- `transformer`（string，JavaScript 表达式）
  - 用于将执行器原始输出转换为规范结构的 JavaScript 表达式。
  - 在执行器返回数据后求值。
  - 表达式执行时，**只提供一个变量：`$data`**。
  - 应产出：
    - 单个对象，或
    - 对象数组。

每个结果对象至少应包含：

- `summary`（string）– 简短人类可读摘要。
- `createdAt`（number）– 毫秒级 UNIX 时间戳。
- `data`（any）– 与该条目关联的原始或结构化载荷。

## JavaScript 表达式约定

- 不要使用额外注入变量。
- 不要依赖外部 helper。
- 表达式内部只使用 `$data` 与 JavaScript 自带能力。
- 推荐保持表达式短小；复杂逻辑应移到 Node 脚本。

示例：

```js
$data.tasks.map(task => ({
  id: `${task.id}-${task.date_updated}`,
  summary: task.name,
  createdAt: Number(task.date_updated),
  data: task,
}))
```
