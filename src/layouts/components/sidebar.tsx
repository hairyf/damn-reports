import { Button } from '@heroui/react'
import { Icon } from '@iconify/react'
import { useCallback, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useEvent } from 'react-use'
import { siteConfig } from '@/config/site'

const iconMap: Record<string, string> = {
  '/': 'lucide:layout-dashboard',
  '/report': 'lucide:bar-chart-3',
  '/record': 'lucide:database',
  '/source': 'lucide:file-text',
  '/workflow': 'lucide:workflow',
  '/setting': 'lucide:settings',
}

const MIN_WIDTH = 80
const MAX_WIDTH = 224
const DEFAULT_WIDTH = 224
// 小于此宽度时进入紧凑模式
const COMPACT_WIDTH = 175

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const draggingRef = useRef(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(DEFAULT_WIDTH)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    draggingRef.current = true
    startXRef.current = e.clientX
    startWidthRef.current = width
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [width])

  useEvent('mousemove', (e: MouseEvent) => {
    if (!draggingRef.current)
      return

    const diff = e.clientX - startXRef.current
    const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidthRef.current + diff))
    setWidth(newWidth)
  })

  useEvent('mouseup', () => {
    if (draggingRef.current) {
      draggingRef.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  })

  const isCompact = width < COMPACT_WIDTH

  return (
    <aside
      className="h-screen order-divider relative flex-shrink-0"
      style={{ width: `${width}px` }}
    >
      <div className="absolute h-[64px] w-full" data-tauri-drag-region />

      <div className="pt-1 pb-4 h-full overflow-hidden px-4">
        <div className={`flex items-center gap-2 py-4 mb-1 select-none ${isCompact ? 'justify-center px-0' : 'px-2'}`}>
          <Icon icon="lucide:file-bar-chart" className="w-8 h-8" />
          {!isCompact && (
            <h2 className="text-lg font-semibold flex-shrink-0">{siteConfig.name}</h2>
          )}
        </div>
        <nav className="space-y-2">
          {siteConfig.sideItems.map((item) => {
            const href = `/${item.href.split('/')[1]}`
            const isActive = item.href === '/' ? location.pathname === item.href : location.pathname.startsWith(href)
            const icon = iconMap[href] || 'lucide:circle'
            return (
              <Button
                key={item.href}
                onPress={() => navigate(item.href)}
                variant={isActive ? 'solid' : 'light'}
                color={isActive ? 'primary' : 'default'}
                size="lg"
                radius="lg"
                className={`w-full ${isCompact ? 'justify-center px-0 py-3 min-w-0' : 'justify-start gap-3 px-4 py-3 h-11'}`}
                startContent={isCompact ? undefined : <Icon icon={icon} className="w-5 h-5" />}
              >
                {isCompact
                  ? (
                      <Icon icon={icon} className="w-5 h-5" />
                    )
                  : (
                      <span className="text-base flex-1 text-left">{item.label}</span>
                    )}
              </Button>
            )
          })}
        </nav>
      </div>
      <div
        onMouseDown={handleMouseDown}
        className="absolute right-0 top-0 w-1 h-full cursor-ew-resize flex items-center justify-center group"
      >
        <div className="w-[1px] h-full bg-foreground/10" />
      </div>
    </aside>
  )
}
