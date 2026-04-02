import type { Protocol, Provider } from '@/store/modules/agent'
import { addToast, Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Tooltip } from '@heroui/react'
import { Icon } from '@iconify/react'
import { useState } from 'react'
import { useStore } from 'valtio-define'
import { store } from '@/store'
import { PROVIDERS } from '@/store/modules/agent/config'

const PRESET_PROVIDERS = ['deepseek', 'openai', 'anthropic', 'google'] as const satisfies readonly Provider[]

function snapshot(agent: {
  apiKey: string
  provider: Provider
  model: string
  cutsom: { type: Protocol, url: string }
}) {
  return JSON.stringify({
    apiKey: agent.apiKey,
    provider: agent.provider,
    model: agent.model,
    cutsom: { ...agent.cutsom },
  })
}

function parseSnapshot(s: string): {
  apiKey: string
  provider: Provider
  model: string
  cutsom: { type: Protocol, url: string }
} {
  return JSON.parse(s)
}

export function SettingLlmCard() {
  const agent = useStore(store.agent)
  const isEnvConfigured = !!(import.meta.env.VITE_LLM_API_KEY as string | undefined)?.trim()
  const [savedSnapshot, setSavedSnapshot] = useState(() => snapshot(agent))
  const hasUnsavedChanges = snapshot(agent) !== savedSnapshot

  function handleSave() {
    setSavedSnapshot(snapshot(agent))
    addToast({ title: '已保存', description: '模型设置已保存' })
  }

  function handleUndo() {
    const restored = parseSnapshot(savedSnapshot)
    store.agent.apiKey = restored.apiKey
    store.agent.provider = restored.provider
    store.agent.model = restored.model
    store.agent.cutsom.type = restored.cutsom.type
    store.agent.cutsom.url = restored.cutsom.url
  }

  const presetModels = agent.provider !== 'custom' ? PROVIDERS[agent.provider]!.models : []

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
              selectedKeys={[agent.provider]}
              onSelectionChange={(keys) => {
                const provider = Array.from(keys)[0] as Provider
                if (!provider)
                  return
                store.agent.provider = provider
                if (provider !== 'custom') {
                  const cfg = PROVIDERS[provider]!
                  if (cfg.models.length > 0)
                    store.agent.model = cfg.models[0].value
                }
              }}
              placeholder="选择 Provider"
              aria-label="选择 Provider"
            >
              <>
                {PRESET_PROVIDERS.map((key) => {
                  const cfg = PROVIDERS[key]!
                  return (
                    <SelectItem key={key}>
                      {cfg.label}
                    </SelectItem>
                  )
                })}
                <SelectItem key="custom">
                  自定义 (Custom)
                </SelectItem>
              </>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Icon icon="lucide:sparkles" className="w-4 h-4 text-default-500" />
              <label className="text-sm font-medium">Model</label>
            </div>
            {presetModels.length > 0
              ? (
                  <Select
                    selectedKeys={[agent.model]}
                    onSelectionChange={(keys) => {
                      const model = Array.from(keys)[0] as string
                      if (model)
                        store.agent.model = model
                    }}
                    placeholder="选择具体模型"
                    aria-label="选择具体模型"
                  >
                    {presetModels.map(opt => (
                      <SelectItem key={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </Select>
                )
              : (
                  <Input
                    value={agent.model}
                    onChange={e => (store.agent.model = e.target.value)}
                    placeholder="模型 ID"
                  />
                )}
          </div>
        </div>
        {agent.provider === 'custom' && (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Icon icon="lucide:network" className="w-4 h-4 text-default-500" />
                <label className="text-sm font-medium">协议</label>
              </div>
              <Select
                selectedKeys={[agent.cutsom.type]}
                onSelectionChange={(keys) => {
                  const p = Array.from(keys)[0] as Protocol
                  if (p)
                    store.agent.cutsom.type = p
                }}
                aria-label="自定义接口协议"
              >
                <SelectItem key="openai">OpenAI Compatible</SelectItem>
                <SelectItem key="anthropic">Anthropic Messages</SelectItem>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Icon icon="lucide:link" className="w-4 h-4 text-default-500" />
                <label className="text-sm font-medium">Base URL</label>
              </div>
              <Input
                value={agent.cutsom.url}
                onChange={e => (store.agent.cutsom.url = e.target.value)}
                placeholder="https://api.openai.com/v1"
              />
            </div>
          </>
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
            value={isEnvConfigured ? '••••••••' : agent.apiKey}
            onChange={e => (store.agent.apiKey = e.target.value)}
            type="password"
            placeholder="sk-..."
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
