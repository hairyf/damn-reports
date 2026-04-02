import type { Protocol, Provider } from '@/store/modules/agent'
import { Button, Card, CardBody, Input, Select, SelectItem } from '@heroui/react'
import { Icon } from '@iconify/react'
import { useState } from 'react'
import { useStore } from 'valtio-define'
import { presetProviders } from '@/ai/provider'
import { store } from '@/store'

const PRESET_PROVIDERS = ['deepseek', 'openai', 'anthropic', 'google'] as const satisfies readonly Provider[]

export function StepLlmSetting() {
  const persisted = useStore(store.agent)
  const [apiKey, setApiKey] = useState(persisted.apiKey)
  const [provider, setProvider] = useState<Provider>(persisted.provider)
  const [model, setModel] = useState(persisted.model)
  const [baseUrl, setBaseUrl] = useState(persisted.cutsom.url)
  const [protocol, setProtocol] = useState<Protocol>(persisted.cutsom.type)

  const presetModels = provider !== 'custom' ? presetProviders[provider]!.models : []
  const isCustom = provider === 'custom'

  function onConfirm() {
    store.agent.apiKey = apiKey
    store.agent.provider = provider
    store.agent.model = model
    store.agent.cutsom.url = baseUrl
    store.agent.cutsom.type = protocol
  }

  return (
    <Card className="w-full" shadow="none">
      <CardBody className="p-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className="bg-indigo-50 dark:bg-indigo-500/20 p-3 rounded-xl">
            <Icon icon="lucide:brain-circuit" className="text-indigo-600 w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">模型设置</h2>
            <p className="text-gray-500 dark:text-white/60 text-sm">配置大语言模型以增强自动化能力</p>
          </div>
        </div>
        <div className="space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-gray-400 dark:text-white/40 text-xs uppercase tracking-widest font-semibold px-1">
                Provider
              </label>
              <Select
                selectedKeys={[provider]}
                onSelectionChange={(keys) => {
                  const p = Array.from(keys)[0] as Provider
                  if (!p)
                    return
                  setProvider(p)
                  if (p !== 'custom') {
                    const cfg = presetProviders[p]!
                    if (cfg.models.length > 0)
                      setModel(cfg.models[0].value)
                  }
                  else {
                    setModel('')
                  }
                }}
                placeholder="选择 Provider"
                aria-label="选择 Provider"
              >
                <>
                  {PRESET_PROVIDERS.map((key) => {
                    const cfg = presetProviders[key]!
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
            <div className="space-y-2">
              <label className="text-gray-400 dark:text-white/40 text-xs uppercase tracking-widest font-semibold px-1">
                Model
              </label>
              {presetModels.length > 0
                ? (
                    <Select
                      selectedKeys={model ? [model] : []}
                      onSelectionChange={(keys) => {
                        const m = Array.from(keys)[0] as string
                        if (m)
                          setModel(m)
                      }}
                      placeholder="选择模型"
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
                      type="text"
                      value={model}
                      onChange={e => setModel(e.target.value)}
                      placeholder="模型 ID"
                    />
                  )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-gray-400 dark:text-white/40 text-xs uppercase tracking-widest font-semibold px-1">
              API Key
            </label>
            <Input
              type="text"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
          </div>
          {isCustom && (
            <>
              <div className="space-y-2">
                <label className="text-gray-400 dark:text-white/40 text-xs uppercase tracking-widest font-semibold px-1">
                  协议
                </label>
                <Select
                  selectedKeys={[protocol]}
                  onSelectionChange={(keys) => {
                    const p = Array.from(keys)[0] as Protocol
                    if (p)
                      setProtocol(p)
                  }}
                  aria-label="自定义接口协议"
                >
                  <SelectItem key="openai">OpenAI Compatible</SelectItem>
                  <SelectItem key="anthropic">Anthropic Messages</SelectItem>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-gray-400 dark:text-white/40 text-xs uppercase tracking-widest font-semibold px-1">
                  Base URL
                </label>
                <Input
                  type="text"
                  value={baseUrl}
                  onChange={e => setBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                />
              </div>
            </>
          )}
          <div className="flex space-x-3">
            <Button
              onPress={onConfirm}
              color="primary"
              className="flex-1"
              isDisabled={!apiKey || !model}
            >
              <span>确认配置</span>
              <Icon icon="lucide:arrow-right" className="w-4.5 h-4.5" />
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
