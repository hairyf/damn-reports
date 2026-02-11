import { Card, CardBody, CardHeader, Input } from '@heroui/react'
import { Icon } from '@iconify/react'
import { useStore } from 'valtio-define'

export function SettingLlmCard() {
  const setting = useStore(store.setting)

  return (
    <Card shadow="none">
      <CardHeader className="flex gap-3 items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <Icon icon="lucide:brain-circuit" className="w-5 h-5" />
          <p className="text-md font-semibold">LLM 设置</p>
        </div>
      </CardHeader>
      <CardBody className="gap-6 pt-0">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Icon icon="lucide:key" className="w-4 h-4 text-default-500" />
            <label className="text-sm font-medium">
              API Key
              {setting.isLlmEnvConfigured && <span className="text-xs text-primary ml-2">(已由环境变量配置)</span>}
            </label>
          </div>
          <Input
            value={setting.llmApiKey}
            onChange={e => store.setting.llmApiKey = e.target.value}
            type="password"
            placeholder="sk-..."
            isDisabled={setting.isLlmEnvConfigured}
            endContent={
              setting.isLlmEnvConfigured ? <Icon icon="lucide:lock" className="text-default-400" /> : null
            }
          />
        </div>

        {!setting.isLlmEnvConfigured && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Icon icon="lucide:link" className="w-4 h-4 text-default-500" />
              <label className="text-sm font-medium">Base URL</label>
            </div>
            <Input
              value={setting.llmBaseUrl}
              onChange={e => store.setting.llmBaseUrl = e.target.value}
              placeholder="https://api.deepseek.com"
            />
          </div>
        )}
      </CardBody>
    </Card>
  )
}
