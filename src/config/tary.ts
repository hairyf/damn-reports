import { proxy } from '@hairy/utils'
import { defaultWindowIcon } from '@tauri-apps/api/app'
import { Menu, MenuItem } from '@tauri-apps/api/menu'
import { TrayIcon } from '@tauri-apps/api/tray'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { exit } from '@tauri-apps/plugin-process'

async function setup() {
  const menu = await Menu.new({
    items: [
      await MenuItem.new({
        id: 'overview',
        text: '打开面板',
        action: async () => {
          const current = getCurrentWindow()
          await current.setAlwaysOnTop(true)
          await current.show()
          await current.unminimize()
          await current.setFocus()
          window.navigate('/')
        },
      }),
      await MenuItem.new({
        id: 'reports',
        text: '报告列表',
        action: async () => {
          const current = getCurrentWindow()
          await current.setAlwaysOnTop(true)
          await current.show()
          await current.unminimize()
          await current.setFocus()
          window.navigate('/report')
        },
      }),
      await MenuItem.new({
        id: 'settings',
        text: '设置',
        action: async () => {
          const current = getCurrentWindow()
          await current.setAlwaysOnTop(true)
          await current.show()
          await current.unminimize()
          await current.setFocus()

          window.navigate('/settings')
        },
      }),

      // Quit Section
      await MenuItem.new({
        id: 'quit',
        text: '退出',
        action: () => void exit(0),
      }),
    ],
  })

  const tray = await TrayIcon.new({
    menu,
    icon: (await defaultWindowIcon() || undefined),
    menuOnLeftClick: false,

    tooltip: 'Damn Daily Reports',
    action: async (event) => {
      // 处理托盘图标点击事件
      if (event.type === 'DoubleClick') {
        const window = getCurrentWindow()
        await window.show()
        await window.unminimize()
        await window.setFocus()
      }
    },
  })
  return tray
}

export const tray = proxy<TrayIcon>()
setup().then(tray.proxy.update)

import.meta.hot?.on('vite:beforeFullReload', () => {
  tray.proxy.original()?.close()
})
