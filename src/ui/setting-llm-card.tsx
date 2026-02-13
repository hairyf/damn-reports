import type { LlmProvider } from '@/store/modules/llm'
import { Card, CardBody, CardHeader, Input, Select, SelectItem } from '@heroui/react'
import { Icon } from '@iconify/react'
import { useStore } from 'valtio-define'
import { VercelModelSelect } from '@/components/vercel-model-select'
import { LLM_PROVIDERS } from '@/store/modules/llm'

export function SettingLlmCard() {
  const llm = useStore(store.llm)
  const isEnvConfigured = store.llm.effectiveIsEnvConfigured

  return (
    <Card shadow="none">
      <CardHeader className="flex gap-3 items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <Icon icon="lucide:brain-circuit" className="w-5 h-5" />
          <p className="text-md font-semibold">模型设置</p>
        </div>
      </CardHeader>
      <CardBody className="gap-6 pt-0">
        {!isEnvConfigured && llm.isCustomProvider && (
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
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Icon icon="lucide:cpu" className="w-4 h-4 text-default-500" />
            <label className="text-sm font-medium">模型 / Provider</label>
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
            : llm.modelOptions.length > 0
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
                    {llm.modelOptions.map(opt => (
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
      </CardBody>
    </Card>
  )
}
