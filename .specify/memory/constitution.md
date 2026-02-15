<!--
Sync Impact Report:
- Version change: (none) → 1.0.0
- Initial creation from constitution-template.md
- Modified principles: N/A (new)
- Added sections: Technology Stack, Development Workflow, Governance
- Removed sections: N/A
- Templates: plan-template.md ✅ (Constitution Check gate references constitution)
       spec-template.md ✅ (scope alignment)
       tasks-template.md ✅ (task categorization compatible)
       checklist-template.md ✅ (no constitution references)
- Follow-up TODOs: None
-->

# Damn Reports Constitution

## Core Principles

### I. Local-First & Privacy

所有用户日报数据 MUST 存储在本地 SQLite 数据库中；不得将个人报告内容强制同步至第三方云端；敏感操作（如 API 密钥）MUST 通过 Tauri 安全存储（如 plugin-store）管理。

**Rationale**: 日报包含工作隐私；本地优先是产品承诺，不得妥协。

### II. Tauri-Native Architecture

功能 MUST 优先使用 Tauri 提供的原生能力（IPC、插件、Rust 侧逻辑）；重计算、敏感逻辑 SHOULD 放在 Rust 后端；前端负责 UI 与用户交互，保持轻量。

**Rationale**: Tauri 提供性能与安全；滥用纯前端方案会削弱优势。

### III. User-Controlled AI

AI 生成报告是辅助工具，用户 MUST 能够审查、编辑、采纳或拒绝 AI 输出；生成流程 MUST 清晰可追溯（模板、数据源、模型配置可查）；不得在用户未显式确认前自动提交或发布报告。

**Rationale**: 日报代表用户工作记录，用户必须保有最终控制权。

### IV. Testability for Critical Paths

报告生成逻辑、数据同步（ClickUp、Git）、数据库读写等关键路径 MUST 可测试；新增功能 SHOULD 包含可验证的验收场景；测试为可选，但在涉及核心业务逻辑变更时强烈推荐。

**Rationale**: 确保日报生成可靠，减少静默失败。

### V. Simplicity (YAGNI)

MUST 避免过度设计；仅在明确需求出现时引入新抽象或架构；依赖库 SHOULD 保持精简，移除无用依赖；复杂度增加 MUST 有可论证的理由。

**Rationale**: 项目定位为轻量日报工具，过度工程化违背目标。

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, HeroUI v2, Tailwind CSS, Framer Motion
- **Backend**: Tauri 2, Rust
- **Data**: SQLite (Prisma/Kysely), 本地存储
- **AI**: AI SDK（DeepSeek、OpenAI 等），用户可配置
- **Data Sources**: ClickUp、Git，按需扩展

技术选型变更 MUST 与核心原则一致；引入新依赖 SHOULD 有明确用途。

## Development Workflow

- **分支策略**: 功能分支命名 `###-feature-name`，对应 specs 目录结构
- **文档前置**: 新功能 MUST 有 spec.md 和 plan.md 再进入实现
- **验收**: 实现 MUST 覆盖 spec 中的验收场景
- **代码规范**: 遵循项目 ESLint 配置；TypeScript 严格模式

## Governance

- 本 Constitution 高于项目内其他实践约定；PR/Review 时 SHOULD 验证与原则的一致性
- 修订 Constitution 时 MUST 更新版本号、修订日期，并在文件顶部注明 Sync Impact Report
- 版本号遵循语义化：MAJOR 为不兼容的原则变更；MINOR 为新增原则/章节；PATCH 为措辞修正、澄清
- 复杂度或原则偏离 MUST 在 plan.md 的 Complexity Tracking 中记录理由

**Version**: 1.0.0 | **Ratified**: 2025-02-15 | **Last Amended**: 2025-02-15
