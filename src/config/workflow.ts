export function workflow() {
  return {
    name: 'My workflow',
    nodes: [
      {
        parameters: {
          path: 'b7d92e73-c8ef-40cd-8062-adf86697801f',
          options: {},
        },
        type: 'n8n-nodes-base.webhook',
        typeVersion: 2.1,
        position: [
          0,
          0,
        ],
        id: 'dc77598f-c44e-4f48-b20a-0778531ea002',
        name: 'Webhook',
        webhookId: 'b7d92e73-c8ef-40cd-8062-adf86697801f',
      },
      {
        parameters: {
          options: {},
        },
        type: '@n8n/n8n-nodes-langchain.agent',
        typeVersion: 3.1,
        position: [
          208,
          0,
        ],
        id: '436d4c11-5042-4d34-8ce6-17f9f5796a9b',
        name: 'AI Agent',
      },
      {
        parameters: {
          options: {},
        },
        type: '@n8n/n8n-nodes-langchain.lmChatDeepSeek',
        typeVersion: 1,
        position: [
          96,
          208,
        ],
        id: 'f0f6ce30-1513-4f30-a722-31101d6acfd0',
        name: 'DeepSeek Chat Model',
        credentials: {
          deepSeekApi: {
            id: 'O24CfXkQAHGbdMVC',
            name: 'DeepSeek account',
          },
        },
      },
      {
        parameters: {},
        type: '@n8n/n8n-nodes-langchain.memoryBufferWindow',
        typeVersion: 1.3,
        position: [
          224,
          208,
        ],
        id: '953e8d44-3b17-4e13-80b4-140fa1e8cfee',
        name: 'Simple Memory',
      },
      {
        parameters: {
          method: 'POST',
          url: 'http://localhost:6789/report',
          sendBody: true,
          bodyParameters: {
            parameters: [
              {
                name: 'text',
                value: '=',
              },
            ],
          },
          options: {},
        },
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.3,
        position: [
          560,
          0,
        ],
        id: '11bb8ae8-bec8-4b41-834d-bdd08e870712',
        name: 'Save Report',
      },
    ],
    pinData: {},
    connections: {
      'Webhook': {
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
      'Simple Memory': {
        ai_memory: [
          [
            {
              node: 'AI Agent',
              type: 'ai_memory',
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
    },
    active: false,
    settings: {
      executionOrder: 'v1',
      availableInMCP: false,
    },
    tags: [],
    versionId: '',
    meta: {
      templateCredsSetupCompleted: true,
    },
  }
}
