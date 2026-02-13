import { Button, Card, CardBody, Input } from '@heroui/react'
import { Icon } from '@iconify/react'

export function StepLlmSetting() {
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('https://api.deepseek.com')
  const [model, setModel] = useState('deepseek-chat')

  function onConfirm() {
    store.setting.llmApiKey = apiKey
    store.setting.llmBaseUrl = baseUrl
    store.setting.llmModel = model
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
              placeholder="sk-..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-gray-400 dark:text-white/40 text-xs uppercase tracking-widest font-semibold px-1">
              Base URL
            </label>
            <Input
              type="text"
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              placeholder="https://api.deepseek.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-gray-400 dark:text-white/40 text-xs uppercase tracking-widest font-semibold px-1">
              Model
            </label>
            <Input
              type="text"
              value={model}
              onChange={e => setModel(e.target.value)}
              placeholder="deepseek-chat"
            />
          </div>
          <div className="flex space-x-3">
            <Button
              onPress={onConfirm}
              color="primary"
              className="flex-1"
              isDisabled={!apiKey}
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
