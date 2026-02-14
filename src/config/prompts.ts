/** 日报 prompt：system 为角色与规则，prompt 为待处理的数据 */
export function dailyReportPrompt(summaryData: string): { system: string, prompt: string } {
  const system = `# Role
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

  const prompt = `\
# Task
请根据提供的输入数据生成日报。
不要输出任何引导语、客套话或装饰性分隔（如「根据提供的...我为您生成以下日报」「---」等），输出必须是日报正文。

# Input Data
${summaryData}`

  return { system, prompt }
}

/** 优化日报 prompt：system 为角色与规则，prompt 为待优化的内容 */
export function optimizeReportPrompt(currentContent: string, userInstruction?: string): { system: string, prompt: string } {
  const system = `# Role
  你是一位专业的文案优化专家，擅长打磨研发日报的表述质量。
  
  # Rules
  1. **保持信息完整**：不要遗漏或新增任何实际工作内容。
  2. **优化表达**：使语言更加精炼专业，消除冗余和口语化表述。
  3. **修正错误**：修正可能的语法错误或不通顺的表述。
  4. **格式一致**：严格使用纯文本列表格式输出，保持与原文相同的排版结构。
  5. **输出方式**：直接输出优化后的正文，不要使用任何工具或函数调用。`

  const prompt = `\
# Task
${userInstruction?.trim()
  ? `请根据以下要求对日报内容进行优化：${userInstruction.trim()}`
  : '请对以下日报内容进行优化，使其更加简洁、专业、易读。'}

# 当前日报内容
${currentContent}`

  return { system, prompt }
}

/** 标题生成 prompt */
export function generateTitlePrompt(conversationText: string): { system: string, prompt: string } {
  return {
    system: '你是一个标题生成助手，会为用户和 AI 的对话生成简洁的中文标题。',
    prompt: `根据下面这段用户与 AI 的对话内容，生成一个不超过 12 个汉字的对话标题。\n\n`
      + `要求：\n- 只返回标题本身，不要任何解释、标点或引号。\n- 尽量简洁，但能概括本轮对话的主要目的。\n\n对话内容：\n${conversationText}`,
  }
}
