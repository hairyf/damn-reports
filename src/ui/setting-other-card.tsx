import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Switch,
} from '@heroui/react'
import { Icon } from '@iconify/react'
import { sendNotification } from '@tauri-apps/plugin-notification'
import { useStore } from 'valtio-define'
import { store } from '@/store'

export function SettingOtherCard() {
  const setting = useStore(store.setting)

  // 更新自动保存
  function handleAutoSaveChange(value: boolean) {
    store.setting.$state.autoSave = value
  }

  // 更新通知
  function handleNotificationsChange(value: boolean) {
    store.setting.$state.notifications = value
    if (value) {
      sendNotification({
        title: '设置已更新',
        body: '通知功能已启用',
      })
    }
  }

  return (
    <Card shadow="none">
      <CardHeader className="flex gap-3">
        <Icon icon="lucide:settings" className="w-5 h-5" />
        <div className="flex flex-col">
          <p className="text-md font-semibold">其他设置</p>
          <p className="text-small text-default-500">应用行为和偏好设置</p>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="gap-4 p-5">
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
            isSelected={setting.autoSave}
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
            isSelected={setting.notifications}
            onValueChange={handleNotificationsChange}
          />
        </div>
      </CardBody>
    </Card>
  )
}
