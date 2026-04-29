'use client'

import { ChartDonut, ChartPie, FileText, House, Magnifier, Plus, SparklesFill, SquareChartBar } from '@gravity-ui/icons'
import { Button } from '@heroui/react'
import { Topbar } from './topbar'

export function Sidebar() {
  return (
    <div className="flex flex-col gap-1">
      <Topbar />
      <Menu className="px-1">
        <Menu.Group>
          <Menu.Item icon={<Magnifier className="size-3.5" />}>
            Search
          </Menu.Item>
          <Menu.Item icon={<House className="size-3.5" />}>
            Home
          </Menu.Item>
        </Menu.Group>
        <Menu.Group
          label="Addons"
          extra={(
            <Button isIconOnly className="rounded-md size-4 mt-px" variant="ghost">
              <Plus className="size-3 text-foreground/70" />
            </Button>
          )}
        >
          <Menu.Collapse label="日报系统" icon={<SquareChartBar />}>
            <Menu.Item icon={<ChartPie className="size-3.5" />}>
              概览
            </Menu.Item>
            <Menu.Item icon={<FileText className="size-3.5" />}>
              报告
            </Menu.Item>
            <Menu.Item icon={<ChartDonut className="size-3.5" />}>
              来源
            </Menu.Item>
          </Menu.Collapse>
        </Menu.Group>
        <Menu.Group
          label="Agents"
          extra={(
            <Button isIconOnly className="rounded-md size-4 mt-px" variant="ghost">
              <Plus className="size-3 text-foreground/70" />
            </Button>
          )}
        >
          <Menu.Item icon={<SparklesFill className="size-3.5" />}>
            Diana AI
          </Menu.Item>
          <Menu.Item icon={<SparklesFill className="size-3.5" />}>
            Computer AI
          </Menu.Item>
        </Menu.Group>
      </Menu>
    </div>
  )
}
