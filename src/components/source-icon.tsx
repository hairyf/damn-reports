import { AlimailIcon, ClickupIcon, GitIcon, GmailIcon, SlackIcon } from '@/components/icons'

const iconMap = {
  git: GitIcon,
  process: GitIcon,
  email: GmailIcon,
  clickup: ClickupIcon,
  slack: SlackIcon,
  alimail: AlimailIcon,
  other: undefined,
} as const

export type IconMap = typeof iconMap

export interface SourceIconProps {
  type: string
  size?: number
}

export function SourceIcon({ type, size = 24 }: SourceIconProps) {
  const IconComponent = iconMap[type as keyof IconMap]
  if (!IconComponent)
    return <div className="i-lucide-circle" />
  return <IconComponent size={size} />
}
