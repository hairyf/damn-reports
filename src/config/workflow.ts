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

export function get_report_workflow_params(options: ReportWorkflowOptions) {
  return {
    name: options.name,
    nodes: [
      {
        parameters: {
          path: 'b7d92e73-c8ef-40cd-8062-adf86697801f',
          options: {
            responseData: '{ message: "" }',
          },
        },
        type: 'n8n-nodes-base.webhook',
        typeVersion: 2.1,
        position: [
          -304,
          0,
        ],
        id: '41eb82b9-b4c4-4825-afe9-1e464ef37ec9',
        name: 'Webhook',
        webhookId: 'b7d92e73-c8ef-40cd-8062-adf86697801f',
      },
      {
        parameters: {
          promptType: 'define',
          text: '=请根据以下数据生成日报：\n\n{{ JSON.stringify($json.data) }}\n\n格式要求：\n\n- xxx\n- xxx\n- xxx',
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
                name: 'workflowId',
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
          assignments: {
            assignments: [
              {
                id: 'de1f12f7-7ab9-432f-a423-83593eaa304a',
                name: 'summary',
                value: '={{ $json.summary }}',
                type: 'string',
              },
              {
                id: '0eacc199-869a-4146-9b42-267474137525',
                name: 'source',
                value: '={{ $json.source }}',
                type: 'string',
              },
              {
                id: 'b2b3be97-ecf2-441e-8801-ca44608e1f49',
                name: 'status',
                value: '={{ $json.data?.status?.status || \'none\' }}',
                type: 'string',
              },
              {
                id: 'ce5f36b0-a555-4eed-8be7-c1fb3bbe05e8',
                name: 'category',
                value: '={{ $json.data?.list?.name || \'none\' }}',
                type: 'string',
              },
              {
                id: '24f1e3bc-4aec-4556-ac5b-58fed09761c0',
                name: 'updatedAt',
                value: '={{\n  $json?.updatedAt || Date($json?.data?.date_updated)\n}}',
                type: 'string',
              },
              {
                id: '7e9a2399-563c-4950-b537-7e8164ff5478',
                name: 'files',
                value: '={{ $json.data?.files?.map(file => file.path) || null }}',
                type: 'array',
              },
            ],
          },
          options: {},
        },
        type: 'n8n-nodes-base.set',
        typeVersion: 3.4,
        position: [
          96,
          0,
        ],
        id: '975b1f6d-9f90-48ea-9f37-d13531690672',
        name: 'Edit Fields',
      },
      {
        parameters: {
          options: {},
        },
        type: '@n8n/n8n-nodes-langchain.chatTrigger',
        typeVersion: 1.4,
        position: [
          -304,
          160,
        ],
        id: '82f8e4da-76c4-4409-a2c8-fa02e103726c',
        name: 'When chat message received',
        webhookId: 'edd1332c-e33e-4e68-a0d9-dc6bd244519e',
      },
      {
        parameters: {},
        type: 'n8n-nodes-base.manualTrigger',
        typeVersion: 1,
        position: [
          -304,
          -160,
        ],
        id: 'b42de8e2-40a0-40a8-a9f3-3e5dce817ef5',
        name: 'When clicking ‘Execute workflow’',
      },
      {
        parameters: {
          aggregate: 'aggregateAllItemData',
          options: {},
        },
        type: 'n8n-nodes-base.aggregate',
        typeVersion: 1,
        position: [
          256,
          0,
        ],
        id: '9d4dc1b5-3989-446e-ae91-b3088555228b',
        name: 'Aggregate',
      },
      {
        parameters: {
          content: '### Default Automation Report Workflow\nThis workflow is used to generate a report of the daily automation.',
          height: 80,
          width: 528,
          color: 7,
        },
        type: 'n8n-nodes-base.stickyNote',
        position: [
          -16,
          -240,
        ],
        typeVersion: 1,
        id: 'ebd9a725-176c-4d65-b74e-497b940505bf',
        name: 'Sticky Note',
      },
      {
        parameters: {
          url: 'http://localhost:6789/record',
          sendQuery: true,
          queryParameters: {
            parameters: [
              {
                name: 'type',
                value: 'weekly',
              },
              {
                name: 'workflowId',
                value: options.workflowId,
              },
            ],
          },
          options: {},
        },
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.3,
        position: [
          -64,
          0,
        ],
        id: 'e93fc30f-06a5-47a6-b003-9c9b1a32c61e',
        name: 'Get Records',
      },
    ],
    connections: {
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
      'Edit Fields': {
        main: [
          [
            {
              node: 'Aggregate',
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
      'When clicking ‘Execute workflow’': {
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
      'Aggregate': {
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
      'Get Records': {
        main: [
          [
            {
              node: 'Edit Fields',
              type: 'main',
              index: 0,
            },
          ],
        ],
      },
    },

    pinData: {},
    active: true,
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
