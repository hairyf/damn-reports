import { Icon } from '@iconify/react'
import { AlimailIcon, ClickupIcon, GitIcon, GmailIcon, SlackIcon } from '@/components/icons'

const iconMap = {
  git: GitIcon,
  git_directory: GitIcon,
  process: GitIcon,
  email: GmailIcon,
  clickup: ClickupIcon,
  slack: SlackIcon,
  alimail: AlimailIcon,
  other: undefined,
} as const

export type IconMap = typeof iconMap

export interface ToolIconProps {
  type: string
  size?: number
}

export function ToolIcon({ type, size = 24 }: ToolIconProps) {
  const IconComponent = iconMap[type as keyof IconMap]
  if (!IconComponent)
    return <Icon icon="lucide:bubbles" className="text-cyan-500" style={{ width: size, height: size }} />
  return <IconComponent size={size} />
}
