import { Select, SelectItem } from '@heroui/react'
import { createElement } from 'react'

const sourceOptions = [
  { label: 'Git', value: 'git', icon: GitIcon },
  { label: 'Clickup', value: 'clickup', icon: ClickupIcon },
  { label: 'Slack', value: 'slack', icon: SlackIcon },
  { label: 'Gmail', value: 'gmail', icon: GmailIcon },
  { label: 'Alimail', value: 'alimail', icon: AlimailIcon },
]

export interface SourceSelectProps {
  onChange?: (value: string) => void
  value?: string
  className?: string
  placeholder?: string
  isClearable?: boolean
}
export function SourceSelect(props: SourceSelectProps) {
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
      renderValue={([item]) => {
        return (
          <div className="flex items-center gap-2">
            {item?.props?.startContent}
            {item?.props?.children}
          </div>
        )
      }}
    >
      {sourceOptions.map((option) => {
        return (
          <SelectItem
            key={option.value}
            startContent={option.icon ? createElement(option.icon, { size: 16 }) : null}
          >
            {option.label}
          </SelectItem>
        )
      })}
    </Select>
  )
}
