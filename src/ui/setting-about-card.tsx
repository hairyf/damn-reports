import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Switch,
} from '@heroui/react'
import { Icon } from '@iconify/react'
import { sendNotification } from '@tauri-apps/plugin-notification'
import { useState } from 'react'
import { useStore } from 'valtio-define'
import { store } from '@/store'

export function SettingAboutCard() {
  const setting = useStore(store.setting)
  const [checkingUpdate, setCheckingUpdate] = useState(false)

  // 更新自动检查更新设置
  function handleAutoCheckUpdateChange(value: boolean) {
    store.setting.$state.autoCheckUpdate = value
  }

  // 检查更新
  async function checkForUpdate() {
    setCheckingUpdate(true)

    try {
      // 这里可以调用实际的更新检查 API
      // 例如：const response = await fetch('https://api.example.com/check-update')
      // 现在使用模拟逻辑
      await new Promise(resolve => setTimeout(resolve, 1500))

      // 模拟检查结果（实际应该从 API 获取）
      const currentVersion = '0.1.0'
      const latestVersion = '0.1.0' // 可以从 API 获取

      if (latestVersion > currentVersion) {
        if (setting.notifications) {
          sendNotification({
            title: '发现新版本',
            body: `新版本 ${latestVersion} 可用`,
          })
        }
      }
      else {
        if (setting.notifications) {
          sendNotification({
            title: '检查完成',
            body: '您使用的是最新版本',
          })
        }
      }
    }
    catch (error) {
      console.error('检查更新失败:', error)
      if (setting.notifications) {
        sendNotification({
          title: '检查更新失败',
          body: '请稍后重试',
        })
      }
    }
    finally {
      setCheckingUpdate(false)
    }
  }

  return (
    <Card shadow="none">
      <CardHeader className="flex gap-3">
        <Icon icon="lucide:info" className="w-5 h-5" />
        <div className="flex flex-col">
          <p className="text-md font-semibold">关于</p>
          <p className="text-small text-default-500">应用信息</p>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="gap-4 p-5">
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Icon icon="lucide:package" className="w-4 h-4 text-default-500" />
            <span className="text-default-600">名称：</span>
            <span className="text-default-900">Damn Daily Reports</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon icon="lucide:tag" className="w-4 h-4 text-default-500" />
            <span className="text-default-600">版本：</span>
            <span className="text-default-900">0.1.0</span>
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
            onValueChange={handleAutoCheckUpdateChange}
          />
        </div>

        {/* 检查更新按钮 */}
        <div className="flex gap-4">
          <Button
            color="primary"
            variant="flat"
            className="flex-1"
            radius="full"
            onPress={checkForUpdate}
            isLoading={checkingUpdate}
            startContent={
              !checkingUpdate && <Icon icon="lucide:search" className="w-4 h-4" />
            }
          >
            {checkingUpdate ? '检查中...' : '立即检查'}
          </Button>
          <Button
            color="danger"
            variant="flat"
            radius="full"
            startContent={<Icon icon="lucide:refresh-cw" className="w-4 h-4" />}

          >
            重置数据
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
