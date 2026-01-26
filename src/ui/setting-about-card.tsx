import { Else, If, Then } from '@hairy/react-lib'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Switch,
} from '@heroui/react'
import { Icon } from '@iconify/react'
import { useOverlay } from '@overlastic/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getVersion } from '@tauri-apps/api/app'
import { useMount } from 'react-use'
import { useStore } from 'valtio-define'
import { store } from '@/store'

export function SettingAboutCard() {
  const setting = useStore(store.setting)
  const updater = useStore(store.updater)
  const openModal = useOverlay(Modal)
  // 获取应用版本号
  const { data: appVersion = '' } = useQuery({
    queryKey: ['appVersion'],
    queryFn: async () => getVersion(),
  })

  const { mutate: checkForUpdate, isPending: checkingUpdate } = useMutation({
    mutationFn: () => store.updater.check(),
  })

  const { mutate: reset, isPending: resetting } = useMutation({
    mutationFn: async () => {
      await openModal({
        title: '重置数据',
        content: '确定要重置数据吗？此操作将删除所有数据，并重置所有设置。',
        confirmText: '确定',
        cancelText: '取消',
      })

      // TODO
    },

  })

  useMount(store.updater.check)

  return (
    <Card shadow="none">
      <CardHeader className="flex gap-3 py-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon icon="lucide:info" className="w-5 h-5" />
          <p className="text-md font-semibold">关于</p>
        </div>
        <If cond={updater.isNewVersion}>
          <div className="flex items-center gap-2 text-sm text-default-500">
            <Icon icon="tabler:sparkles" className="w-4 h-4" />
            <span>新版本可用</span>
          </div>
        </If>
      </CardHeader>
      <CardBody className="gap-4 pt-0">
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Icon icon="lucide:package" className="w-4 h-4 text-default-500" />
            <span className="text-default-600">名称：</span>
            <span className="text-default-900">Damn Reports</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon icon="lucide:tag" className="w-4 h-4 text-default-500" />
            <span className="text-default-600">版本：</span>
            <span className="text-default-900">{appVersion || '加载中...'}</span>
          </div>
        </div>

        {/* 自动检查更新 */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Icon icon="lucide:refresh-cw" className="w-4 h-4 text-default-500" />
              <label className="text-sm font-medium">自动检查更新</label>
            </div>
            <p className="text-xs text-default-400">
              启动时自动检查是否有新版本可用
            </p>
          </div>
          <Switch
            isSelected={setting.autoCheckUpdate}
            onValueChange={value => store.setting.autoCheckUpdate = value}
          />
        </div>

        {/* 检查更新按钮 */}
        <div className="flex gap-4">
          <If cond={updater.isNewVersion}>
            <Then>
              <Button
                color="primary"
                variant="flat"
                className="flex-1"
                radius="full"
                onPress={() => checkForUpdate()}
                isLoading={checkingUpdate}
                startContent={<Icon icon="lucide:download" className="w-4 h-4" />}
              >
                立即更新
              </Button>
            </Then>
            <Else>
              <Button
                color="primary"
                variant="flat"
                className="flex-1"
                radius="full"
                onPress={() => checkForUpdate()}
                isLoading={checkingUpdate}
                startContent={
                  !checkingUpdate && <Icon icon="lucide:search" className="w-4 h-4" />
                }
              >
                {checkingUpdate ? '检查中...' : '立即检查'}
              </Button>
            </Else>
          </If>
          <Button
            color="danger"
            variant="flat"
            radius="full"
            startContent={<Icon icon="lucide:refresh-cw" className="w-4 h-4" />}
            onPress={() => reset()}
            isLoading={resetting}
          >
            重置数据
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
