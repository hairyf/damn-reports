import { Button } from '@heroui/react'
import { Magnifier, NodesLeft } from '@gravity-ui/icons'

export function Navbar() {
  return (
    <nav className="flex items-center justify-between gap-4 px-6 py-3">
      <div className="min-w-0">
        <div className="truncate text-base font-semibold text-foreground">Quick recipes for dinner</div>
        <div className="text-xs text-foreground/60">Updated 2m ago</div>
      </div>

      <div className="flex items-center gap-2">
        <Button aria-label="Search" variant="ghost" size="sm" isIconOnly>
          <Magnifier className="size-4" />
        </Button>
        <Button variant="primary" size="sm" className="gap-2">
          <NodesLeft className="size-4" />
          Share
        </Button>
      </div>
    </nav>
  )
}
