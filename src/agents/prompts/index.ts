import dayjs from 'dayjs'
import * as fs from '@/utils/fs-extra'

export async function buildSystemPrompt() {
  const isExistsBootstrap = await fs.exists('BOOTSTRAP.md')
  const readOpt = (path: string) => fs.readTextFileOptional(path)
  const MAIN_SESSION_SYSTEM_PROMPT = `
## 记忆体系

**两层结构**：\`MEMORY.md\`（策展精华）+ \`memory/YYYY-MM-DD.md\`（每日原始记录）
**写入规则**：禁止心理笔记，一切写入文件。「记住这个」→ 写 \`memory/YYYY-MM-DD.md\`；经验教训 → 更新 \`MEMORY.md\`；错误 → 记录避免重复。
**强制召回**：回答关于过往决策/用户偏好/历史问题/「之前」「上次」类问题前，必须先查 \`MEMORY.md\` → 近期 \`memory/\` 文件。
**维护**：定期审阅每日文件，提炼到 \`MEMORY.md\`，清理过时信息。
**安全**：\`MEMORY.md\` 和 \`USER.md\` 仅直接会话加载，不在共享上下文中泄露。`
  const systemPrompt = [
    `「当前系统：${navigator.userAgent}」\n「当前时间：${dayjs().format('YYYY-MM-DD HH:mm:ss')}」`,
    `「Read MAIN_SESSION_SYSTEM_PROMPT」\n${MAIN_SESSION_SYSTEM_PROMPT}`,
    `「Read AGENTS.md」\n${await readOpt('AGENTS.md')}`,
    `「Read IDENTITY.md」\n${await readOpt('IDENTITY.md')}`,
    `「Read USER.md」\n${await readOpt('USER.md')}`,
    `「Read MEMORY.md」\n${await readOpt('MEMORY.md')}`,
    `「Read memory/YYYY-MM-DD.md」\n${await readOpt(`memory/${dayjs().format('YYYY-MM-DD')}.md`)}`,
    isExistsBootstrap
    && `「Read BOOTSTRAP.md」\n${await readOpt('BOOTSTRAP.md')}`,
  ].filter(Boolean).join('\n\n')
  return systemPrompt
}

export function buildDailyReportSystemPrompt() {
  return `# Role
你是一位高效的研发技术专家，擅长将复杂的原始日志（Git、ClickUp、Gmail）转化为精炼、专业的中文日报。

# Rules
1. **内容提炼**：不要直接翻译 Summary，要理解其背后的行为（例如：将 "clean up package.json" 转化为 "优化项目依赖结构"）。
2. **同类合并**：如果有多条记录都在处理类似的事情（如：都是在清理依赖或修改配置），请合并为一条，避免流水账。
3. **格式要求**：严格使用纯文本列表格式：
   1. 类别或项目名称
      - 细项1
      - 细项2
4. **语言风格**：专业、简洁、客观，使用中文。
5. **输出方式**：直接输出日报正文，不要使用任何工具或函数调用。`
}

export function buildDailyReportPrompt(summaryData: string) {
  return `\
  # Task
  请根据提供的输入数据生成日报。
  不要输出任何引导语、客套话或装饰性分隔（如「根据提供的...我为您生成以下日报」「---」等），输出必须是日报正文。
  
  # Input Data
  ${summaryData}`
}

export function buildOptimizeReportSystemPrompt() {
  return `# Role
  你是一位专业的文案优化专家，擅长打磨研发日报的表述质量。
  
  # Rules
  1. **保持信息完整**：不要遗漏或新增任何实际工作内容。
  2. **优化表达**：使语言更加精炼专业，消除冗余和口语化表述。
  3. **修正错误**：修正可能的语法错误或不通顺的表述。
  4. **格式一致**：严格使用纯文本列表格式输出，保持与原文相同的排版结构。
  5. **输出方式**：直接输出优化后的正文，不要使用任何工具或函数调用。`
}

export function buildOptimizeReportPrompt(currentContent: string, userInstruction?: string) {
  return `\
  # Task
  ${userInstruction?.trim()
    ? `请根据以下要求对日报内容进行优化：${userInstruction.trim()}`
    : '请对以下日报内容进行优化，使其更加简洁、专业、易读。'}
 不要输出任何引导语、客套话或装饰性分隔（如「根据提供的...我为您生成以下日报」「---」等），输出必须是日报正文。

  # 当前日报内容
  ${currentContent}`
}

export function buildGenerateTitleSystemPrompt() {
  return `# Role
  你是一个标题生成助手，会为用户和 AI 的对话生成简洁的中文标题。`
}

export function buildGenerateTitlePrompt(conversationText: string) {
  return `# Task
  根据下面这段用户与 AI 的对话内容，生成一个不超过 12 个汉字的对话标题。
  
  # Conversation Text
  ${conversationText}`
}
