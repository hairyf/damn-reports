# Feature Specification: Damn Daily Reports (Project Baseline)

**Feature Branch**: `main`
**Created**: 2025-02-15
**Status**: Baseline (existing project scope)
**Input**: Project baseline for implementation planning

## User Scenarios & Testing *(mandatory)*

### User Story 1 - AI 生成日报 (Priority: P1)

用户配置 AI 提供方后，系统根据当日工作记录（ClickUp 任务、Git 提交等）自动生成日报内容，用户可审查、编辑并保存。

**Why this priority**: 核心价值主张，产品存在意义。

**Independent Test**: 配置 LLM → 添加数据源 → 触发生成 → 验证报告内容可编辑并持久化。

**Acceptance Scenarios**:

1. **Given** 已配置 LLM 与至少一个数据源, **When** 用户点击生成, **Then** 系统调用 AI 生成报告内容并在编辑器中展示
2. **Given** 报告已生成, **When** 用户编辑后保存, **Then** 内容存入本地 SQLite

---

### User Story 2 - 数据源同步 (Priority: P2)

用户可添加 ClickUp、Git 等数据源，系统定期或手动拉取工作记录并存入本地 record 表。

**Why this priority**: 为 AI 生成提供输入数据。

**Independent Test**: 添加数据源 → 执行同步 → 验证 record 表有新数据。

**Acceptance Scenarios**:

1. **Given** 已配置 ClickUp API, **When** 用户触发同步, **Then** 任务数据写入 record 表
2. **Given** 已配置 Git 仓库, **When** 用户触发同步, **Then** 提交记录写入 record 表

---

### User Story 3 - 定时自动生成 (Priority: P3)

系统在工作日按计划（如每日 18:00）自动执行数据收集与报告生成。

**Why this priority**: 减少人工干预，提升体验。

**Independent Test**: 配置 cron → 等待触发时间或手动触发 → 验证报告自动生成。

**Acceptance Scenarios**:

1. **Given** 已配置工作日 18:00 定时任务, **When** 到达指定时间, **Then** 系统自动执行生成流程并创建报告

---

### Edge Cases

- 无 LLM 配置时：引导用户完成 LLM 设置
- 数据源 API 失败：记录错误状态，不影响本地已有数据
- 离线场景：本地优先，所有报告与记录均存本地

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统 MUST 将用户日报数据存储在本地 SQLite 数据库中
- **FR-002**: 系统 MUST 使用 Tauri IPC、插件、Rust 侧逻辑实现敏感或重计算逻辑
- **FR-003**: AI 生成报告 MUST 允许用户审查、编辑、采纳或拒绝，不得在未显式确认前自动提交
- **FR-004**: 系统 MUST 支持 ClickUp、Git 等数据源拉取工作记录
- **FR-005**: 系统 MUST 支持定时（cron）自动生成报告
- **FR-006**: 敏感配置（如 API 密钥）MUST 通过 Tauri plugin-store 管理

### Key Entities

- **Report**: 日报/周报/月报/年报，含 name、type、content、createdAt、updatedAt
- **Record**: 工作记录（来自数据源），含 id、summary、data、source、tool、createdAt、updatedAt
- **Workspace**: 工作空间，含 workflow、name

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户可在 2 分钟内完成首次 LLM 配置并生成首份日报
- **SC-002**: 报告生成、编辑、保存全流程在 500ms 内完成本地持久化
- **SC-003**: 定时任务在指定工作日时间点可靠触发
