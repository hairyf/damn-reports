import { Button } from '@heroui/react'
import { Icon } from '@iconify/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { siteConfig } from '@/config/site'

const iconMap: Record<string, string> = {
  '/': 'lucide:layout-dashboard',
  '/database': 'lucide:database',
  '/source': 'lucide:file-text',
  '/n8n': 'lucide:workflow',
  '/settings': 'lucide:settings',
}

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <aside className="w-64 h-screen border-r border-divider">
      <div className="p-4">
        <div className="flex items-center gap-2 p-4 mb-4">
          <Icon icon="lucide:file-bar-chart" className="w-6 h-6" />
          <h2 className="text-lg font-semibold">{siteConfig.name}</h2>
        </div>
        <nav className="space-y-1.5">
          {siteConfig.sideItems.map((item) => {
            const isActive = location.pathname === item.href
            const icon = iconMap[item.href] || 'lucide:circle'
            return (
              <Button
                key={item.href}
                onPress={() => navigate(item.href)}
                variant={isActive ? 'solid' : 'light'}
                color={isActive ? 'primary' : 'default'}
                className="w-full justify-start gap-3 px-4 py-3 rounded-xl"
                startContent={<Icon icon={icon} className="w-5 h-5" />}
              >
                <span className="text-base flex-1 text-left">{item.label}</span>
              </Button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
