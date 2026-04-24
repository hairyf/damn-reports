import { Avatar, Button, ScrollShadow, Separator } from '@heroui/react'
import { Comment, Compass, Bulb, Plus } from '@gravity-ui/icons'

const navItems = [
  { label: 'New Chat', icon: Plus, variant: 'ghost' as const },
  { label: 'Library', icon: Bulb, variant: 'ghost' as const },
  { label: 'Explore', icon: Compass, variant: 'ghost' as const },
]

const recentItems = [
  { label: 'Quick recipes for dinner', isActive: true },
  { label: 'Launch plan for Q3 rollout', isActive: false },
  { label: 'Rewrite homepage value prop', isActive: false },
  { label: 'Weekly team update summary', isActive: false },
]

export function Sidebar() {
  return (
    <aside className="flex w-72 shrink-0 flex-col gap-2 rounded-xl bg-surface p-2 pt-3">
      <div className="flex items-center gap-3 px-2">
        <Avatar size="sm">
          <Avatar.Fallback>DH</Avatar.Fallback>
        </Avatar>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground">Darnell Howe</div>
          <div className="truncate text-xs text-foreground/60">darnell@email.com</div>
        </div>
      </div>

      <div className="flex flex-col gap-1 px-1 pt-1">
        {navItems.map((item) => (
          <Button
            key={item.label}
            fullWidth
            variant={item.variant}
            className="justify-start gap-2"
          >
            <item.icon className="size-4" />
            <span className="text-sm">{item.label}</span>
          </Button>
        ))}
      </div>

      <Separator className="my-1" />

      <div className="px-2 text-xs font-medium text-foreground/60">Recent</div>

      <ScrollShadow className="flex-1 px-1 pb-2" hideScrollBar>
        <div className="flex flex-col gap-1">
          {recentItems.map((item) => (
            <Button
              key={item.label}
              fullWidth
              variant={item.isActive ? 'secondary' : 'ghost'}
              className="justify-start gap-2"
            >
              <Comment className="size-4" />
              <span className="truncate text-sm">{item.label}</span>
            </Button>
          ))}
        </div>
      </ScrollShadow>
    </aside>
  )
}
