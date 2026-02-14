import type { LlmProvider } from '@/store/modules/llm'
import { addToast, Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Tooltip } from '@heroui/react'
import { Icon } from '@iconify/react'
import { useState } from 'react'
import { useStore } from 'valtio-define'
import { VercelModelSelect } from '@/components/vercel-model-select'
import { LLM_PROVIDERS } from '@/store/modules/llm'

function snapshot(llm: { apiKey: string, baseUrl: string, provider: string, model: string }) {
  return JSON.stringify({ apiKey: llm.apiKey, baseUrl: llm.baseUrl, provider: llm.provider, model: llm.model })
}

function parseSnapshot(s: string): { apiKey: string, baseUrl: string, provider: LlmProvider, model: string } {
  const { apiKey, baseUrl, provider, model } = JSON.parse(s)
  return { apiKey, baseUrl, provider, model }
}

export function SettingLlmCard() {
  const llm = useStore(store.llm)
  const isEnvConfigured = store.llm.envConfigured
  const [savedSnapshot, setSavedSnapshot] = useState(() => snapshot(llm))
  const hasUnsavedChanges = snapshot(llm) !== savedSnapshot

  function handleSave() {
    setSavedSnapshot(snapshot(llm))
    addToast({ title: '已保存', description: '模型设置已保存' })
  }

  function handleUndo() {
    const restored = parseSnapshot(savedSnapshot)
    store.llm.apiKey = restored.apiKey
    store.llm.baseUrl = restored.baseUrl
    store.llm.provider = restored.provider
    store.llm.model = restored.model
  }

  return (
    <Card shadow="none">
      <CardHeader className="py-4">
        <div className="w-full h-8 flex gap-3 items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon icon="lucide:brain-circuit" className="w-5 h-5" />
            <p className="text-md font-semibold">模型设置</p>
          </div>
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2">
              <Tooltip content="撤销">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  aria-label="撤销"
                  onPress={handleUndo}
                >
                  <Icon icon="lucide:undo" className="w-4 h-4" />
                </Button>
              </Tooltip>
              <Button
                color="primary"
                size="sm"
                startContent={<Icon icon="lucide:save" className="w-4 h-4" />}
                onPress={handleSave}
              >
                保存
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardBody className="gap-6 pt-0">

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Icon icon="lucide:cpu" className="w-4 h-4 text-default-500" />
              <label className="text-sm font-medium">Provider</label>
            </div>
            <Select
              selectedKeys={[llm.provider]}
              onSelectionChange={(keys) => {
                const provider = Array.from(keys)[0] as LlmProvider
                if (provider) {
                  store.llm.provider = provider
                  const config = LLM_PROVIDERS[provider]
                  store.llm.model = config.models.length > 0 ? config.models[0].value : ''
                }
              }}
              placeholder="选择 Provider"
              aria-label="选择 Provider"
            >
              {Object.entries(LLM_PROVIDERS).map(([key, config]) => (
                <SelectItem key={key}>
                  {config.label}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Model</label>
            {llm.provider === 'vercel'
              ? (
                  <VercelModelSelect
                    value={llm.model}
                    onChange={v => (store.llm.model = v)}
                    placeholder="搜索并选择模型"
                    ariaLabel="选择具体模型"
                    isDisabled={isEnvConfigured}
                  />
                )
              : llm.providerModels.length > 0
                ? (
                    <Select
                      selectedKeys={[llm.model]}
                      onSelectionChange={(keys) => {
                        const model = Array.from(keys)[0] as string
                        if (model)
                          store.llm.model = model
                      }}
                      placeholder="选择具体模型"
                      aria-label="选择具体模型"
                    >
                      {llm.providerModels.map(opt => (
                        <SelectItem key={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </Select>
                  )
                : (
                    <Input
                      value={llm.model}
                      onChange={e => (store.llm.model = e.target.value)}
                      placeholder="如 gpt-4、claude-3"
                    />
                  )}
          </div>
        </div>
        {llm.customProvider && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Icon icon="lucide:link" className="w-4 h-4 text-default-500" />
              <label className="text-sm font-medium">Base URL</label>
            </div>
            <Input
              value={llm.baseUrl}
              onChange={e => (store.llm.baseUrl = e.target.value)}
              placeholder="https://api.openai.com/v1"
            />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Icon icon="lucide:key" className="w-4 h-4 text-default-500" />
            <label className="text-sm font-medium">
              API Key
              {isEnvConfigured && <span className="text-xs text-primary ml-2">(已由环境变量配置)</span>}
            </label>
          </div>
          <Input
            value={isEnvConfigured ? '••••••••' : llm.apiKey}
            onChange={e => (store.llm.apiKey = e.target.value)}
            type="password"
            placeholder={llm.provider === 'vercel' ? 'Vercel AI Gateway API Key' : 'sk-...'}
            isDisabled={isEnvConfigured}
            endContent={
              isEnvConfigured ? <Icon icon="lucide:lock" className="text-default-400" /> : null
            }
          />
        </div>
      </CardBody>
    </Card>
  )
}
