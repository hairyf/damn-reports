import { Select, SelectItem } from '@heroui/react'
import { useStore } from 'valtio-define'
import { store } from '@/store'

export interface SourceSelectProps {
  onChange?: (value: string) => void
  value?: string
  className?: string
  placeholder?: string
  isClearable?: boolean
}
export function SourceSelect(props: SourceSelectProps) {
  const { options } = useStore(store.tool)

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
      {options.map(option => (
        <SelectItem
          key={option.id}
          startContent={<ToolIcon type={option.id} size={16} />}
        >
          {option.name}
        </SelectItem>
      ))}
    </Select>
  )
}
