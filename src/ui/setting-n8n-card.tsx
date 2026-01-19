import { Button, Card, CardBody, CardHeader, Divider, Switch } from '@heroui/react'
import { Icon } from '@iconify/react'
import { N8NIcon } from '@/components/icons'

export function SettingN8nCard() {
  // 静态数据，暂时不接真实数据
  const isRunning = true // 运行状态
  const isBackground = false // 常驻后台
  const accountEmail = 'user@example.com' // 账号邮箱

  return (
    <Card shadow="none">
      <CardHeader className="flex gap-3">
        <N8NIcon className="w-5 h-5" />
        <div className="flex flex-col">
          <p className="text-md font-semibold">N8N</p>
          <p className="text-small text-default-500">N8N 进程管理</p>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="gap-4 p-5">
        {/* 运行状态(文字加 dot) */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Icon icon="lucide:activity" className="w-4 h-4 text-default-500" />
              <label className="text-sm font-medium">运行状态</label>
            </div>
            <p className="text-xs text-default-400">
              进程当前运行状态
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${isRunning ? 'bg-success' : 'bg-default-300'}`}
            />
            <span className="text-sm text-default-600">
              {isRunning ? '运行中' : '已停止'}
            </span>
          </div>
        </div>

        {/* 常驻后台 */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Icon icon="lucide:server" className="w-4 h-4 text-default-500" />
              <label className="text-sm font-medium">常驻后台</label>
            </div>
            <p className="text-xs text-default-400">
              启用后软件关闭时，进程仍然会继续运行
            </p>
          </div>
          <Switch
            isSelected={isBackground}
            onValueChange={() => {}}
          />
        </div>

        {/* 账号信息(显示账号邮箱)，还有重置账号按钮 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Icon icon="lucide:user" className="w-4 h-4 text-default-500" />
                <label className="text-sm font-medium">账号信息</label>
              </div>
              <p className="text-xs text-default-400">
                {accountEmail}
              </p>
            </div>
            <Button
              color="danger"
              variant="flat"
              radius="full"
              startContent={<Icon icon="lucide:refresh-cw" className="w-4 h-4" />}
            >
              重置账号
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
