import { If } from '@hairy/react-lib'
import {
  Button,
  Navbar as HeroUINavbar,
  Link,
  NavbarContent,
  NavbarItem,
} from '@heroui/react'
import { Icon } from '@iconify/react'
import { useQuery } from '@tanstack/react-query'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useEffect, useState } from 'react'
import { useStore } from 'valtio-define'

export function Navbar() {
  const user = useStore(store.user)
  const [currentTime, setCurrentTime] = useState(() => new Date())

  // 实时更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // 格式化时间显示（仅显示时间，不包含日期）
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }

  const { data: workspace } = useQuery({
    queryKey: ['workspace', user.workspaceId],
    queryFn: () => db.workspace.findUnique(user.workspaceId!.toString()),
    enabled: !!user.workspaceId,
  })

  async function handleMinimize() {
    const appWindow = getCurrentWindow()
    await appWindow.minimize()
  }

  async function handleMaximize() {
    const appWindow = getCurrentWindow()
    if (await appWindow.isMaximized())
      await appWindow.unmaximize()
    else
      await appWindow.maximize()
  }

  async function handleClose() {
    const appWindow = getCurrentWindow()
    await appWindow.hide()
  }

  return (
    <div>
      <HeroUINavbar maxWidth="full" position="sticky" className="relative bg-transparent backdrop-filter-none">
        <div className="absolute inset-0 w-full" data-tauri-drag-region />
        <NavbarContent justify="start">
          <If cond={!!workspace}>
            <NavbarItem className="text-default-500 flex items-center gap-1">
              <Icon icon="lucide:layout-dashboard" className="w-4 h-4" />
              <span className="text-sm">Workspace / </span>
              <span className="text-sm">{workspace?.name}</span>
            </NavbarItem>
          </If>
        </NavbarContent>
        <NavbarContent justify="end">
          <NavbarItem className="hidden sm:flex gap-2">
            <Link isExternal href={siteConfig.links.github} title="GitHub">
              <GithubIcon className="text-default-500" />
            </Link>
            <ThemeSwitch />
          </NavbarItem>

          <NavbarItem className="flex items-center gap-2">
            <Icon icon="lucide:clock" className="w-4 h-4 text-default-500" />
            <span className="text-sm text-default-500 font-mono">{formatTime(currentTime)}</span>
          </NavbarItem>

          <NavbarItem className="flex items-center gap-1">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={handleMinimize}
              className="min-w-8 w-8 h-8"
              aria-label="Minimize"
            >
              <Icon icon="lucide:minus" className="w-4 h-4" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={handleMaximize}
              className="min-w-8 w-8 h-8"
              aria-label="Maximize"
            >
              <Icon icon="lucide:square" className="w-4 h-4" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="danger"
              onPress={handleClose}
              className="min-w-8 w-8 h-8"
              aria-label="Close"
            >
              <Icon icon="lucide:x" className="w-4 h-4" />
            </Button>
          </NavbarItem>
        </NavbarContent>
      </HeroUINavbar>
    </div>
  )
}
