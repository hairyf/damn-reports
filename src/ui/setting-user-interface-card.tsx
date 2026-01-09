import type { Language } from '@/store/modules/setting'
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Select,
  SelectItem,
} from '@heroui/react'
import { useTheme } from '@heroui/use-theme'
import { Icon } from '@iconify/react'
import { useStore } from 'valtio-define'
import { store } from '@/store'

const languageOptions: { label: string, value: Language }[] = [
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
]

export function SettingUserInterfaceCard() {
  const setting = useStore(store.setting)
  const { setTheme, theme } = useTheme()

  // 更新语言
  function handleLanguageChange(value: Language) {
    store.setting.$state.language = value
  }

  return (
    <Card>
      <CardHeader className="flex gap-3">
        <Icon icon="lucide:palette" className="w-5 h-5" />
        <div className="flex flex-col">
          <p className="text-md font-semibold">用户界面</p>
          <p className="text-small text-default-500">自定义应用的外观和语言</p>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="gap-4">
        {/* 语言设置 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Icon icon="lucide:languages" className="w-4 h-4 text-default-500" />
            <label className="text-sm font-medium">语言</label>
          </div>
          <Select
            selectedKeys={[setting.language]}
            onSelectionChange={keys => handleLanguageChange(Array.from(keys)[0] as Language)}
            className="max-w-xs"
            startContent={<Icon icon="lucide:globe" className="w-4 h-4" />}
          >
            {languageOptions.map((option) => {
              return (
                <SelectItem key={option.value}>
                  {option.label}
                </SelectItem>
              )
            })}
          </Select>
        </div>

        {/* 主题模式设置 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Icon icon="lucide:palette" className="w-4 h-4 text-default-500" />
            <label className="text-sm font-medium">主题模式</label>
          </div>
          <Select
            selectedKeys={[theme]}
            onSelectionChange={keys => setTheme(Array.from(keys)[0] as string)}
            className="max-w-xs"
            renderValue={([item]) => {
              return (
                <div className="flex items-center gap-2">
                  {item?.props?.startContent}
                  {item?.props?.children}
                </div>
              )
            }}
          >
            {[
              { label: '浅色', value: 'light', icon: 'lucide:sun' },
              { label: '深色', value: 'dark', icon: 'lucide:moon' },
              { label: '跟随系统', value: 'system', icon: 'lucide:monitor' },
            ].map((option) => {
              return (
                <SelectItem
                  key={option.value}
                  startContent={<Icon icon={option.icon} className="w-4 h-4" />}
                >
                  {option.label}
                </SelectItem>
              )
            })}
          </Select>
        </div>
      </CardBody>
    </Card>
  )
}
