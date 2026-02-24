# Record API Contract

## Database (Record Model)

| Method | Input | Output |
|--------|-------|--------|
| `findMany` | `{ search?, source?, sourceIds?, date? }` | `RecordRow[]` |
| `findManyPage` | `RecordFindManyPageInput` | `{ data: RecordRow[], total: number }` |
| `findManyPageWithSources` | `input`, `sourceMap` | `{ data: RecordInJoined[], total }` |

## RecordInJoined

```ts
interface RecordInJoined extends RecordRow {
  sourceName: string
}
```

## Query Filters

- `search`：summary 模糊匹配
- `source`：按 tool 过滤
- `sourceIds`：按 source ID 列表过滤
- `date`：按 updatedAt 日期范围过滤
