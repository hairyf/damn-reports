# Implementation Plan: Damn Daily Reports (Project Baseline)

**Branch**: `main` | **Date**: 2025-02-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/main/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command.

## Summary

Damn Daily Reports 是一款 AI 驱动日报生成器，基于 Tauri 2 构建。核心能力：从 ClickUp、Git 等数据源拉取工作记录，通过 AI 生成日报/周报/月报/年报，支持定时自动生成。所有数据本地 SQLite 存储，遵循 Constitution 的 Local-First、Tauri-Native、User-Controlled AI 原则。

## Technical Context

**Language/Version**: TypeScript 5.8, Rust (Tauri 2), Node.js ≥20.19
**Primary Dependencies**: React 19, Vite 7, HeroUI v2, Tailwind CSS 4, Framer Motion, AI SDK (DeepSeek/OpenAI), Tauri 2, Kysely, Prisma
**Storage**: SQLite (Kysely 查询，Prisma migration)，本地文件存储
**Testing**: ESLint、TypeScript strict；核心路径可测试（cron、report、record 模块）
**Target Platform**: 桌面端（Windows/macOS/Linux），Tauri WebView
**Project Type**: single（前端 + Tauri Rust  backend 同仓）
**Performance Goals**: 报告生成响应 <5s（含 AI 调用），本地 CRUD <500ms
**Constraints**: 离线优先、<100MB 内存占用、无强制云端同步
**Scale/Scope**: 单人使用，单机 <10k 报告、<100k records

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Local-First & Privacy | ✅ PASS | 数据存 SQLite；API 密钥用 plugin-store |
| II. Tauri-Native Architecture | ✅ PASS | 重逻辑在 Rust；前端 UI 轻量 |
| III. User-Controlled AI | ✅ PASS | 用户审查/编辑/采纳；无自动提交 |
| IV. Testability for Critical Paths | ✅ PASS | report、record、cron 可测 |
| V. Simplicity (YAGNI) | ✅ PASS | 依赖精简，无过度设计 |

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/          # 可复用 UI 组件（report-editor, report-generator, source-item 等）
├── config/              # 常量、client、 prompts、storage
├── cron/                # 定时任务（schedule, executor, report, workday）
├── database/            # Kysely 模型（report, record, model）
├── hooks/
├── layouts/             # 布局（default, sidebar, navbar）
├── pages/               # 路由页（report, record, source, tool, chat, setting）
├── store/               # 状态（report, chat, llm, source, cron, tool, updater）
├── styles/              # CSS（main, components）
├── tools/               # AI 工具（http, sql, file, exec, date, app, skill）
├── ui/                  # UI 卡片、设置组件
├── utils/               # 工具函数
├── App.tsx
├── main.tsx
└── provider.tsx

tauri/                   # Rust 后端
prisma/                  # Schema 与 migration（主 DB 可能在 tauri 下）
```

**Structure Decision**: 单仓 Tauri 应用。前端 `src/` 负责 UI 与业务编排；`cron/` 处理定时；`database/` 封装 Kysely 访问；`store/` 管理 React 状态；`tools/` 为 AI 函数调用提供实现。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

无违规；当前设计符合 Constitution 各项原则。
