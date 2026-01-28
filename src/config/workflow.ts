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
          736,
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
          224,
          0,
        ],
        id: '23ad93af-29f1-4bbd-ad88-38ae8d4b24b5',
        name: 'Get Records',
      },
      {
        parameters: {
          rule: {
            interval: [
              {
                triggerAtHour: 17,
                triggerAtMinute: 45,
              },
            ],
          },
        },
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1.3,
        position: [
          32,
          -240,
        ],
        id: '171c796b-9250-4ef2-8fe2-e1abef156101',
        name: 'Schedule Trigger',
      },
      {
        parameters: {
          method: 'POST',
          url: 'http://localhost:6789/record/collect',
          options: {},
        },
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.3,
        position: [
          224,
          -240,
        ],
        id: '5a99775f-8db1-448e-9f26-8bbb39cdca45',
        name: 'Collect data',
      },
      {
        parameters: {
          path: 'adf86697801f',
          options: {},
        },
        type: 'n8n-nodes-base.webhook',
        typeVersion: 2.1,
        position: [
          32,
          0,
        ],
        id: '7b831986-1874-4ff6-ba43-c76fe7e3b3c1',
        name: 'Software Trigger',
        webhookId: 'adf86697801f',
      },
      {
        parameters: {
          amount: 2,
          unit: 'minutes',
        },
        type: 'n8n-nodes-base.wait',
        typeVersion: 1.1,
        position: [
          432,
          -240,
        ],
        id: 'c00ef0ea-a9e4-4a31-8913-34d8caea019e',
        name: 'Waiting to obtain',
        webhookId: '26f28e92-fbdd-4d22-8c13-97b311ac1ebf',
      },
    ],
    connections: {
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
      'Get Records': {
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
      'Schedule Trigger': {
        main: [
          [
            {
              node: 'Collect data',
              type: 'main',
              index: 0,
            },
          ],
        ],
      },
      'Collect data': {
        main: [
          [
            {
              node: 'Waiting to obtain',
              type: 'main',
              index: 0,
            },
          ],
        ],
      },
      'Software Trigger': {
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
      'Waiting to obtain': {
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
    pinData: {},
    meta: { templateCredsSetupCompleted: true },
  }
}
