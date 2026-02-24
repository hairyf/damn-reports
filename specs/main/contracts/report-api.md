# Report API Contract

## Store Actions (`store.report`)

| Action | Input | Output | Description |
|--------|-------|--------|-------------|
| `streamGenerate` | `systemPrompt`, `userPrompt` | `Promise<string>` | 流式调用 LLM，返回最终文本 |
| `generate` | - | `Promise<void>` | 收集 record → 构建 prompt → 生成并保存报告 |
| `optimize` | - | `Promise<void>` | 对当前报告内容进行优化 |
| `save` | `id`, `content` | `Promise<void>` | 保存报告内容到 DB |
| `resetStream` | - | `void` | 清除流式内容 |

## Database (Report Model)

| Method | Input | Output |
|--------|-------|--------|
| `findMany` | `{ search?, type?, page?, pageSize? }` | `Report[]` |
| `findFirstByType` | `{ type }` | `Report \| null` |

## Prompt Templates

- `dailyReportPrompt` / `optimizeReportPrompt`：来自 `@/config/prompts`
