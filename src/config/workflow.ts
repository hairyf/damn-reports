export interface ReportWorkflowOptions {
  workflowId: string | number
  name: string
  credentials: {
    deepSeekApi?: {
      id: string
      name: string
    }
  }
}

export function getReportWorkflowData(options: ReportWorkflowOptions) {
  return {
    name: 'Default Report Workflow',
    nodes: [
      {
        parameters: {
          promptType: 'define',
          text: '=# Role\n你是一位高效的研发技术专家，擅长将复杂的原始日志（Git、ClickUp、Gmail）转化为精炼、专业的中文日报。\n\n# Task\n请根据提供的 JSON 数据生成日报。\n\n# Rules\n1. **内容提炼**：不要直接翻译 Summary，要理解其背后的行为（例如：将 "clean up package.json" 转化为 "优化项目依赖结构"）。\n2. **同类合并**：如果有多条记录都在处理类似的事情（如：都是在清理依赖或修改配置），请合并为一条，避免流水账。\n3. **格式要求**：严格使用纯文本列表格式：\n   1. 类别或项目名称\n      - 细项1\n      - 细项2\n4. **语言风格**：专业、简洁、客观，使用中文。\n\n# Input Data\n\n{{ JSON.stringify($json.data) }}',
          options: {},
        },
        type: '@n8n/n8n-nodes-langchain.agent',
        typeVersion: 3.1,
        position: [
          416,
          0,
        ],
        id: '4f3cb78f-5a5b-4ceb-9fc1-bd7c770f4748',
        name: 'AI Agent',
      },
      {
        parameters: {
          options: {},
        },
        type: '@n8n/n8n-nodes-langchain.lmChatDeepSeek',
        typeVersion: 1,
        position: [
          416,
          176,
        ],
        id: 'd8c6b2fd-fdc1-4557-b16f-aa3112fe2ce2',
        name: 'DeepSeek Chat Model',
        credentials: options.credentials,
      },
      {
        parameters: {
          method: 'POST',
          url: 'http://localhost:6789/report',
          sendHeaders: true,
          headerParameters: {
            parameters: [
              {
                name: 'Content-Type',
                value: 'application/json',
              },
            ],
          },
          sendBody: true,
          bodyParameters: {
            parameters: [
              {
                name: 'content',
                value: '={{ $json.output }}',
              },
              {
                name: 'workspace_id',
                value: options.workflowId,
              },
            ],
          },
          options: {},
        },
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.3,
        position: [
          704,
          0,
        ],
        id: '7cfc9ea1-4866-4fcc-8e11-a7cb2dd49ac4',
        name: 'Save Report',
      },
      {
        parameters: {
          url: 'http://localhost:6789/record/summary',
          sendQuery: true,
          queryParameters: {
            parameters: [
              {
                name: 'type',
                value: 'daily',
              },
            ],
          },
          options: {},
        },
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.3,
        position: [
          256,
          0,
        ],
        id: '23ad93af-29f1-4bbd-ad88-38ae8d4b24b5',
        name: 'Get Records',
      },
      {
        parameters: {
          path: 'adf86697801f',
          options: {},
        },
        type: 'n8n-nodes-base.webhook',
        typeVersion: 2.1,
        position: [
          80,
          0,
        ],
        id: '7b831986-1874-4ff6-ba43-c76fe7e3b3c1',
        name: 'Webhook',
        webhookId: 'adf86697801f',
      },
    ],
    pinData: {},
    connections: {
      'DeepSeek Chat Model': {
        ai_languageModel: [
          [
            {
              node: 'AI Agent',
              type: 'ai_languageModel',
              index: 0,
            },
          ],
        ],
      },
      'AI Agent': {
        main: [
          [
            {
              node: 'Save Report',
              type: 'main',
              index: 0,
            },
          ],
        ],
      },
      'When chat message received': {
        main: [
          [
            {
              node: 'Get Records',
              type: 'main',
              index: 0,
            },
          ],
        ],
      },
      'HTTP Request': {
        main: [
          [
            {
              node: 'AI Agent',
              type: 'main',
              index: 0,
            },
          ],
        ],
      },
      'Webhook': {
        main: [
          [
            {
              node: 'Get Records',
              type: 'main',
              index: 0,
            },
          ],
        ],
      },
    },
    active: false,
    settings: {
      executionOrder: 'v1',
      availableInMCP: false,
    },
    meta: {
      templateCredsSetupCompleted: true,
    },
    tags: [],
  }
}
