import { tool } from 'ai'
import { z } from 'zod'

/** AI SDK 在无 tools 时会忽略 toolChoice，需传占位 tool 才能让 tool_choice: none 生效 */
export const TOOLS_NONE_PLACEHOLDER = {
  _noop: tool({
    description: 'Do not use. Output text directly.',
    inputSchema: z.object({}),
  }),
}
