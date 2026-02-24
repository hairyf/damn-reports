# Quickstart: Damn Daily Reports

**Phase 1 Output** | **Date**: 2025-02-15

## 前置条件

- Node.js ≥20.19
- pnpm
- Rust（参考 [Tauri 文档](https://tauri.app/start/prerequisites/)）

## 安装与启动

```bash
pnpm install
pnpm tauri dev
```

## 首次运行流程

1. **配置 LLM**：设置 → LLM → 选择提供方（DeepSeek/OpenAI 等）并填入 API Key
2. **添加数据源**：数据源 → 添加 ClickUp 或 Git 源
3. **生成报告**：首页或报告页 → 点击生成

## 关键目录

| 路径 | 用途 |
|------|------|
| `src/store/modules/report` | 报告生成逻辑 |
| `src/store/modules/source` | 数据源管理 |
| `src/cron` | 定时任务 |
| `src/database` | Kysely 模型 |
| `src/tools` | AI 函数调用 |
| `src/config/prompts.ts` | 报告模板与 prompt |

## 数据库

- SQLite 路径由 Tauri 配置决定（如 `tauri/prisma/database/main.db`）
- 迁移：`pnpm prisma migrate dev`
- 实体生成：`pnpm sea:generate`（若使用 sea-orm）

## 测试

```bash
pnpm lint
pnpm typecheck
```

## 相关文档

- [spec.md](./spec.md)：功能规格
- [plan.md](./plan.md)：实施计划
- [data-model.md](./data-model.md)：数据模型
- [contracts/](./contracts/)：API 契约
