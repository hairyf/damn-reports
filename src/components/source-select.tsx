import { getToolOptions } from '@/api/tools'
import { AlimailIcon, ClickupIcon, GitIcon, GmailIcon, SlackIcon } from '@/components/icons'
import { Select, SelectItem } from '@heroui/react'
import { useQuery } from '@tanstack/react-query'
import { createElement } from 'react'

const iconByToolId: Record<string, any> = {
  git_directory: GitIcon,
  git: GitIcon,
  clickup: ClickupIcon,
  slack: SlackIcon,
  gmail: GmailIcon,
  alimail: AlimailIcon,
}

export interface SourceSelectProps {
  onChange?: (value: string) => void
  value?: string
  className?: string
  placeholder?: string
  isClearable?: boolean
}
export function SourceSelect(props: SourceSelectProps) {
  const { data: options = [] } = useQuery({
    queryKey: ['tool-options'],
    queryFn: getToolOptions,
  })

  return (
    <Select
      className={props.className}
      labelPlacement="outside"
      placeholder={props.placeholder || 'Select source type'}
      selectedKeys={props.value ? [props.value] : []}
      onSelectionChange={(keys) => {
        const selected = Array.from(keys)[0] as string
        props.onChange?.(selected || '')
      }}
      isClearable={props.isClearable}
      aria-label="选择数据源类型"
      renderValue={([item]) => {
        return (
          <div className="flex items-center gap-2">
            {item?.props?.startContent}
            {item?.props?.children}
          </div>
        )
      }}
    >
      {options.map((option) => (
        <SelectItem
          key={option.id}
          startContent={iconByToolId[option.id] ? createElement(iconByToolId[option.id], { size: 16 }) : null}
        >
          {option.name}
        </SelectItem>
      ))}
    </Select>
  )
}
