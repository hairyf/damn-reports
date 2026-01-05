import type { Language, ThemeMode } from '@/store/modules/setting'
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
import { useCallback, useEffect } from 'react'
import { useStore } from 'valtio-define'
import { store } from '@/store'

const languageOptions: { label: string, value: Language }[] = [
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
]

const themeOptions: { label: string, value: ThemeMode, icon: string }[] = [
  { label: '浅色', value: 'light', icon: 'lucide:sun' },
  { label: '深色', value: 'dark', icon: 'lucide:moon' },
  { label: '跟随系统', value: 'system', icon: 'lucide:monitor' },
]

export function SettingUserInterfaceCard() {
  const setting = useStore(store.setting)
  const { setTheme } = useTheme()

  // 检测系统主题偏好
  function getSystemTheme() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    }
    return 'light'
  }

  // 应用主题
  const applyTheme = useCallback((themeMode: ThemeMode) => {
    if (themeMode === 'system') {
      const systemTheme = getSystemTheme()
      setTheme(systemTheme)
    }
    else {
      setTheme(themeMode)
    }
  }, [setTheme])

  // 监听系统主题变化
  useEffect(() => {
    if (setting.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      function handleChange() {
        const systemTheme = getSystemTheme()
        setTheme(systemTheme)
      }
      mediaQuery.addEventListener('change', handleChange)
      return function () {
        mediaQuery.removeEventListener('change', handleChange)
      }
    }
  }, [setting.theme, setTheme])

  // 应用初始主题
  useEffect(() => {
    applyTheme(setting.theme)
  }, [applyTheme, setting.theme])

  // 更新语言
  function handleLanguageChange(value: Language) {
    store.setting.$state.language = value
  }

  // 更新主题
  function handleThemeChange(value: ThemeMode) {
    store.setting.$state.theme = value
    applyTheme(value)
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
            onSelectionChange={function (keys) {
              const selected = Array.from(keys)[0] as Language
              if (selected) {
                handleLanguageChange(selected)
              }
            }}
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
            selectedKeys={[setting.theme]}
            onSelectionChange={function (keys) {
              const selected = Array.from(keys)[0] as ThemeMode
              if (selected) {
                handleThemeChange(selected)
              }
            }}
            className="max-w-xs"
            startContent={(
              <Icon
                icon={
                  themeOptions.find((opt) => { return opt.value === setting.theme })?.icon
                  || 'lucide:palette'
                }
                className="w-4 h-4"
              />
            )}
          >
            {themeOptions.map((option) => {
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
