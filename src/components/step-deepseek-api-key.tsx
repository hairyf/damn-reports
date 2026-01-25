import { Button, Card, CardBody, Input } from '@heroui/react'
import { Icon } from '@iconify/react'

export function StepDeepSeekApiKey() {
  const [apiKey, setApiKey] = useState('')

  function onSkip() {
    store.user.deepseekSkip = true
  }

  return (
    <Card className="w-full" shadow="none">
      <CardBody className="p-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className="bg-indigo-50 dark:bg-indigo-500/20 p-3 rounded-xl">
            <Icon icon="lucide:brain-circuit" className="text-indigo-600 w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">配置 DeepSeek API</h2>
            <p className="text-gray-500 dark:text-white/60 text-sm">连接大模型以增强自动化能力</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-gray-400 dark:text-white/40 text-xs uppercase tracking-widest font-semibold px-1">
              DeepSeek API Key
            </label>
            <Input
              type="text"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
          </div>
          <div className="p-4 border rounded-xl bg-yellow-50 dark:bg-yellow-500/10 border-yellow-500/20">
            <p className="text-xs flex items-start text-yellow-700 dark:text-yellow-200/80">
              <span className="mr-2">💡</span>
              Tip：点击 Skip 跳过，Workflow 将不会自动发布，你需要在自动化页面单独设置模型配置，并手动发布。
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              onPress={onSkip}
            >
              Skip
            </Button>
            <Button
              onPress={() => store.user.createCredential(apiKey)}
              color="primary"
              className="flex-1"
              disabled={!apiKey}
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
