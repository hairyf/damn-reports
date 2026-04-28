/* eslint-disable no-alert */
'use client'

import { House, Magnifier } from '@gravity-ui/icons'
import { Label } from '@heroui/react'
import { Topbar } from './topbar'

export function Sidebar() {
  return (
    <div className="flex flex-col gap-1">
      <Topbar />
      <Menu>
        <Menu.Item prefix={<Magnifier />} onClick={() => alert('Search')}>
          Search
        </Menu.Item>

        <Menu.Item prefix={<House />} to="/">
          Home
        </Menu.Item>

        <div>
          <Label className="px-1.5 text-xs text-foreground/50">Addons</Label>
          <Menu.Group label="日报插件" defaultOpen>
            <Menu.Item>
              概览
            </Menu.Item>
            <Menu.Item>
              报告
            </Menu.Item>
            <Menu.Item>
              来源
            </Menu.Item>
            <Menu.Item>
              工具
            </Menu.Item>
          </Menu.Group>
        </div>

        <div>
          <Label className="px-1.5 text-xs text-foreground/50">Recents</Label>
          <Menu.Item>
            Hello Exchange
          </Menu.Item>
          <Menu.Item>
            旅游攻略
          </Menu.Item>
        </div>

        <div>
          <Label className="px-1.5 text-xs text-foreground/50">Agents</Label>
          <Menu.Item>
            Diana AI
          </Menu.Item>
          <Menu.Item>
            电脑操控
          </Menu.Item>
        </div>
      </Menu>
    </div>
  )
}
