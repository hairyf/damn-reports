import { useMounted } from '@hairy/react-lib'
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Switch,
} from '@heroui/react'
import { Icon } from '@iconify/react'
import { sendNotification } from '@tauri-apps/plugin-notification'
import { useEffect, useState } from 'react'
import {
  getSettings,
  saveSettings,
} from '@/utils/settings-store'

export function SettingOtherConfig() {
  const isMounted = useMounted()
  const [autoSave, setAutoSave] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [loading, setLoading] = useState(true)

  // 加载设置
  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSettings()
        setAutoSave(settings.autoSave)
        setNotifications(settings.notifications)
      }
      catch (error) {
        console.error('Failed to load settings:', error)
      }
      finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  // 更新自动保存
  const handleAutoSaveChange = async (value: boolean) => {
    setAutoSave(value)
    await saveSettings({ autoSave: value })
  }

  // 更新通知
  const handleNotificationsChange = async (value: boolean) => {
    setNotifications(value)
    await saveSettings({ notifications: value })
    if (value) {
      sendNotification({
        title: '设置已更新',
        body: '通知功能已启用',
      })
    }
  }

  if (!isMounted || loading) {
    return (
      <Card>
        <CardBody>
          <div className="text-default-500 text-sm">加载中...</div>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex gap-3">
        <Icon icon="lucide:settings" className="w-5 h-5" />
        <div className="flex flex-col">
          <p className="text-md font-semibold">其他设置</p>
          <p className="text-small text-default-500">应用行为和偏好设置</p>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="gap-4">
        {/* 自动保存 */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Icon icon="lucide:save" className="w-4 h-4 text-default-500" />
              <label className="text-sm font-medium">自动保存</label>
            </div>
            <p className="text-xs text-default-400">
              编辑内容时自动保存，防止数据丢失
            </p>
          </div>
          <Switch
            isSelected={autoSave}
            onValueChange={handleAutoSaveChange}
          />
        </div>

        {/* 通知 */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Icon icon="lucide:bell" className="w-4 h-4 text-default-500" />
              <label className="text-sm font-medium">通知</label>
            </div>
            <p className="text-xs text-default-400">
              启用系统通知，及时了解操作结果
            </p>
          </div>
          <Switch
            isSelected={notifications}
            onValueChange={handleNotificationsChange}
          />
        </div>
      </CardBody>
    </Card>
  )
}
