import type { LlmProvider } from '@/store/modules/llm'
import { Button, Card, CardBody, Input, Select, SelectItem } from '@heroui/react'
import { Icon } from '@iconify/react'
import { useState } from 'react'
import { useStore } from 'valtio-define'
import { LLM_PROVIDERS } from '@/store/modules/llm'
import { VercelModelSelect } from './vercel-model-select'

export function StepLlmSetting() {
  const persisted = useStore(store.llm)
  const [apiKey, setApiKey] = useState(persisted.apiKey)
  const [provider, setProvider] = useState<LlmProvider>(persisted.provider)
  const [baseUrl, setBaseUrl] = useState(persisted.baseUrl)
  const [model, setModel] = useState(persisted.model)

  const modelOptions = LLM_PROVIDERS[provider].models
  const isCustomProvider = provider === 'custom'
  const isVercelProvider = provider === 'vercel'

  function onConfirm() {
    store.llm.apiKey = apiKey
    store.llm.provider = provider
    store.llm.baseUrl = baseUrl
    store.llm.model = model
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
          <div className="space-y-2">
            <label className="text-gray-400 dark:text-white/40 text-xs uppercase tracking-widest font-semibold px-1">
              API Key
            </label>
            <Input
              type="text"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={isVercelProvider ? 'Vercel AI Gateway API Key' : 'sk-...'}
            />
          </div>
          <div className="space-y-2">
            <label className="text-gray-400 dark:text-white/40 text-xs uppercase tracking-widest font-semibold px-1">
              模型 / Provider
            </label>
            <Select
              selectedKeys={[provider]}
              onSelectionChange={(keys) => {
                const p = Array.from(keys)[0] as LlmProvider
                if (p) {
                  setProvider(p)
                  const config = LLM_PROVIDERS[p]
                  if (config.models.length > 0)
                    setModel(config.models[0].value)
                  else if (p === 'custom')
                    setModel('')
                  else if (p === 'vercel')
                    setModel('')
                }
              }}
              placeholder="选择模型"
              aria-label="选择模型"
            >
              {Object.entries(LLM_PROVIDERS).map(([key, config]) => (
                <SelectItem key={key}>
                  {config.label}
                </SelectItem>
              ))}
            </Select>
          </div>
          {isCustomProvider && (
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
          )}
          <div className="space-y-2">
            <label className="text-gray-400 dark:text-white/40 text-xs uppercase tracking-widest font-semibold px-1">
              Model
            </label>
            {isVercelProvider
              ? (
                  <VercelModelSelect
                    value={model}
                    onChange={setModel}
                    placeholder="搜索并选择模型（200+）"
                    ariaLabel="选择具体模型"
                  />
                )
              : modelOptions.length > 0
                ? (
                    <Select
                      selectedKeys={[model]}
                      onSelectionChange={(keys) => {
                        const m = Array.from(keys)[0] as string
                        if (m)
                          setModel(m)
                      }}
                      placeholder="选择模型"
                      aria-label="选择具体模型"
                    >
                      {modelOptions.map(opt => (
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
                      placeholder="如 gpt-4、claude-3"
                    />
                  )}
          </div>
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
