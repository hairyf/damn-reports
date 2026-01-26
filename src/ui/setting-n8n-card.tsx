import { Button, Card, CardBody, CardHeader, Switch } from '@heroui/react'
import { Icon } from '@iconify/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { useStore } from 'valtio-define'
import { N8NIcon } from '@/components/icons'

const statusMap = {
  initial: '初始化',
  installing: '安装中',
  starting: '启动中',
  running: '运行中',
  stopped: '已停止',
}

export function SettingN8nCard() {
  const { ready, userInfo, process } = useStore(store.n8n)

  const { data: version = '-' } = useQuery({
    queryKey: ['n8n_version'],
    queryFn: () => invoke<string>('get_n8n_version'),
  })
  const restartN8nMutation = useMutation({
    mutationFn: () => invoke('restart_n8n'),
  })

  return (
    <Card shadow="none">
      <CardHeader className="flex gap-3 items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <N8NIcon className="w-5 h-5" />
          <p className="text-md font-semibold">N8N 核心</p>
        </div>
        <span className="text-sm">
          v
          {version}
        </span>
      </CardHeader>
      <CardBody className="gap-4 pt-0">
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
              className={`w-2 h-2 rounded-full ${ready ? 'bg-success' : 'bg-default-300'}`}
            />
            <span className="text-sm text-default-600">
              {statusMap[process]}
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
            isSelected={true}
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
                {userInfo?.email}
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
        <div className="flex gap-2">
          <Button color="primary" variant="flat" radius="full" startContent={<Icon icon="lucide:search" className="w-4 h-4" />}>
            检查更新
          </Button>
          <Button variant="bordered" radius="full" onPress={() => restartN8nMutation.mutate()}>
            {restartN8nMutation.isPending ? '重启中...' : '重启进程'}
          </Button>

        </div>
      </CardBody>
    </Card>
  )
}
