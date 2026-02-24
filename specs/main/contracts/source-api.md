# Source API Contract

## Store Actions (`store.source`)

| Action | Input | Output | Description |
|--------|-------|--------|-------------|
| `sync` | - | `Promise<void>` | 从 sources.json 加载配置到内存 |
| `save` | - | `Promise<void>` | 持久化 raw 到 sources.json |
| `find` | `id` | `Source \| undefined` | 按 ID 查找 |
| `create` | `Omit<Source, 'id' \| 'createdAt' \| 'updatedAt'>` | `Promise<Source>` | 创建数据源 |
| `update` | `id`, `partial` | `Promise<void>` | 更新数据源 |
| `collect` | - | `Promise<void>` | 执行所有启用源的 collector |

## Source Schema

```ts
interface Source {
  id: string
  name: string
  description: string
  tool: string // 'clickup' | 'git' | ...
  enable?: boolean
  params: Record<string, any>
  createdAt: string
  updatedAt: string
}
```

## Persistence

- `sources.json`：数据源配置（路径由 storage driver 决定，通常为 app 数据目录）
