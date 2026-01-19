import { Button, Card, CardBody, Input } from '@heroui/react'
import { Icon } from '@iconify/react'

export function StepN8nManualLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function onAccountSubmit(_email: string, _password: string) {

  }

  return (
    <Card className="w-full" shadow="none">
      <CardBody className="p-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className="bg-red-50 dark:bg-red-500/20 p-3 rounded-xl">
            <Icon icon="lucide:alert-circle" className="text-red-500 w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">N8N 账号初始化失败</h2>
            <p className="text-gray-500 dark:text-white/60 text-sm">请输入邮箱密码进行手动登录</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-3">
            <label className="text-gray-400 dark:text-white/40 text-xs uppercase tracking-widest font-semibold px-1">
              Username
            </label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@example.com"
            />
          </div>
          <div className="space-y-3">
            <label className="text-gray-400 dark:text-white/40 text-xs uppercase tracking-widest font-semibold px-1">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button
            onPress={() => onAccountSubmit(email, password)}
            color="primary"
            className="w-full"
            disabled={!email || !password}
          >
            <span>确认登录</span>
            <Icon icon="lucide:arrow-right" className="w-4.5 h-4.5" />
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
