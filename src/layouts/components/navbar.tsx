import {
  Button,
  Navbar as HeroUINavbar,
  Link,
  NavbarContent,
  NavbarItem,
} from '@heroui/react'
import { Icon } from '@iconify/react'
import { getCurrentWindow } from '@tauri-apps/api/window'

export function Navbar() {
  const handleMinimize = async () => {
    const appWindow = getCurrentWindow()
    await appWindow.minimize()
  }

  const handleMaximize = async () => {
    const appWindow = getCurrentWindow()
    const isMaximized = await appWindow.isMaximized()
    if (isMaximized) {
      await appWindow.unmaximize()
    }
    else {
      await appWindow.maximize()
    }
  }

  const handleClose = async () => {
    const appWindow = getCurrentWindow()
    await appWindow.close()
  }

  return (
    <div>
      <HeroUINavbar maxWidth="xl" position="sticky" className="relative">
        <div className="absolute inset-0 w-full" data-tauri-drag-region />
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
