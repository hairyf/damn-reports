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
import { useStore } from 'valtio-define'

export function Navbar() {
  const user = useStore(store.user)

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
            <NavbarItem className="flex items-center gap-1">
              <Icon icon="lucide:layout-dashboard" className="w-4 h-4" />
              <span className="text-sm text-default-500">Workspace / </span>
              <span className="text-sm text-default-500">{workspace?.name}</span>
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
