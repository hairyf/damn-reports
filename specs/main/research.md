# Research: Damn Daily Reports

**Phase 0 Output** | **Date**: 2025-02-15

## 1. Tauri 2 + SQLite + React 前端架构

**Decision**: 使用 Kysely + kysely-dialect-tauri 在前端通过 Tauri 插件访问 SQLite；Prisma 用于 migration 与 schema 定义。

**Rationale**:
- Kysely 提供类型安全的 TypeScript 查询，与 Prisma 迁移配合良好
- Tauri plugin-sql 暴露 SQL 执行能力；kysely-dialect-tauri 适配为 Kysely dialect
- 前端直接读写的模式符合本地优先，无需额外 backend 进程

**Alternatives considered**:
- 全部在 Rust 侧封装 CRUD：增加 IPC 往返与序列化开销，且前端已有 Kysely 生态
- DuckDB/WASM：过度设计，SQLite 足够满足单机日报场景

---

## 2. AI 报告生成流程

**Decision**: 使用 AI SDK (Vercel) + 结构化 prompt + 可选 function calling（tools）拉取 record 数据，生成 Markdown 报告。

**Rationale**:
- AI SDK 支持多个 provider（DeepSeek、OpenAI），与 Constitution 的“用户可配置”一致
- 模板 + 数据注入 + LLM 调用是成熟模式；模板与数据源可追溯，符合 User-Controlled AI
- Tools（http、sql、file、exec 等）可被模型按需调用，扩展数据获取能力

**Alternatives considered**:
- 纯 RAG：日报场景更偏向“按模板填空”，RAG 增加复杂度
- 完全本地模型：可后续扩展，当前以云端 API 为主以降低门槛

---

## 3. 定时任务 (Cron) 实现

**Decision**: 使用 croner 在前端调度；通过 Tauri 能力执行实际逻辑（DB 读写、外部 API 等）。

**Rationale**:
- Tauri 2 无内置 cron，croner 轻量、支持 Cron 表达式
- 前端持有时钟与用户会话，便于按工作日/节假日过滤
- 任务逻辑可调用 Tauri command 或前端 store，保持单一数据流

**Alternatives considered**:
- Rust 侧 systemd/timer 或 native cron：跨平台与打包复杂度高
- Electron 的 node-cron：同属前端调度，croner 更轻

---

## 4. 数据源集成 (ClickUp、Git)

**Decision**: 通过 Tauri HTTP 插件或 fetch 调用外部 API；结果写入 record 表；数据源配置存 plugin-store。

**Rationale**:
- ClickUp REST API、Git 本地执行（exec）均为标准模式
- record 表统一存储，便于 report 生成时聚合
- API 密钥等敏感信息由 plugin-store 加密存储，符合 Constitution

**Alternatives considered**:
- 专用 OAuth 流程：当前以 API Key 为主，OAuth 可在后续迭代增加
- 每数据源独立表：record 泛化设计更利于扩展新数据源

---

## 5. 前端状态管理 (Valtio)

**Decision**: 使用 valtio/valtio-define 管理全局状态；与 React Query 配合处理异步与缓存。

**Rationale**:
- Valtio 轻量、支持细粒度订阅，适合 Tauri 桌面应用
- 与 AI SDK、Kysely 等异步调用配合简单
- valtio-define 提供类型化与 computed 能力

**Alternatives considered**:
- Redux：对当前规模偏重
- Zustand：与 Valtio 类似，项目已选 Valtio
