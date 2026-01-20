import type { TooltipProps } from '@heroui/react'
import type { PropsWithChildren, ReactNode } from 'react'
import { Tooltip } from '@heroui/react'

export interface EllipsisProps extends PropsWithChildren<Omit<TooltipProps, 'content' | 'isOpen' | 'onOpenChange'>> {
  lineClamp?: number
  tooltip?: ReactNode
}

export function Ellipsis({ className, ...props }: EllipsisProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const triggerInnerRef = useRef<HTMLSpanElement>(null)

  function disabled() {
    if (!triggerRef.current)
      return true
    let tooltipDisabled = false
    const { current: trigger } = triggerRef
    const { current: triggerInner } = triggerInnerRef
    if (props.lineClamp !== undefined) {
      tooltipDisabled = trigger.scrollHeight <= trigger.offsetHeight
    }
    else if (triggerInner) {
      tooltipDisabled = triggerInner.getBoundingClientRect().width <= trigger.getBoundingClientRect().width
    }
    return tooltipDisabled
  }

  function onOpenChange(open: boolean) {
    if (disabled())
      return
    setOpen(open)
  }

  return (
    <Tooltip
      showArrow
      color="foreground"
      {...props}
      classNames={{
        ...props.classNames,
        content: ['py-3 px-4', ...(props.classNames?.content || [])],
      }}
      content={(
        <div className="max-w-[400px] max-h-[160px] overflow-y-auto">
          {props.tooltip || props.children}
        </div>
      )}
      isOpen={open}
      onOpenChange={onOpenChange}
    >
      <div
        ref={triggerRef}
        className={cn(
          props.lineClamp === undefined ? 'truncate' : 'line-clamp-[var(--line-clamp)] [display:-webkit-inline-box]!',
          className,
        )}
        style={{ '--line-clamp': props.lineClamp } as React.CSSProperties}
      >
        {props.lineClamp ? props.children : <span ref={triggerInnerRef}>{props.children}</span>}
      </div>
    </Tooltip>
  )
}
