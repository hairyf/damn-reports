import type { PropsWithDetailedHTML } from '@hairy/react-lib'
import type { PropsWithChildren } from 'react'
import { ChevronRight } from '@gravity-ui/icons'
import { Button, Chip, cn } from '@heroui/react'
import clsx from 'clsx'
import { CollapseTransition } from './collapse-transition'

export function Menu(props: PropsWithChildren<PropsWithDetailedHTML>) {
  return (
    <div className={cn('flex flex-col gap-1.5', props.className)}>
      {props.children}
    </div>
  )
}

Menu.Item = MenuItem
Menu.Group = MenuGroup
Menu.Collapse = MenuCollapse

export interface MenuGroupProps extends PropsWithChildren {
  label?: string
  extra?: React.ReactNode
}

export function MenuGroup(props: MenuGroupProps) {
  return (
    <div className={clsx('flex flex-col', props.label ? 'gap-1.5' : 'gap-0.5')}>
      {props.label
        ? (
            <>
              <div className="flex justify-between items-center mr-2">
                <Chip className="bg-transparent rounded-none mt-1.5 text-xs text-foreground/70">
                  {props.label}
                </Chip>
                {props.extra}
              </div>

              <div className="flex flex-col gap-0.5">
                {props.children}
              </div>
            </>
          )
        : props.children}
    </div>
  )
}

export interface MenuItemProps extends PropsWithChildren {
  icon?: React.ReactNode
  label?: React.ReactNode
  suffix?: React.ReactNode
  extra?: React.ReactNode
}

export function MenuItem(props: MenuItemProps) {
  return (
    <div className="item flex">
      <Button
        className="flex-1 justify-start font-medium gap-3"
        variant="ghost"
        size="sm"
      >
        {props.icon && (
          <span className=" text-foreground/50">
            {props.icon}
          </span>
        )}

        <span className="flex-1 text-start">
          {props.label || props.children}
        </span>

        {props.suffix && (
          <span className="text-xs text-foreground/50">{props.suffix}</span>
        )}
        {props.extra && (
          <div className="hidden item-hover:flex items-center gap-1">
            {props.extra}
          </div>
        )}
      </Button>
    </div>
  )
}

export interface MenuCollapseProps extends PropsWithChildren {
  icon?: React.ReactNode
  label?: React.ReactNode
}

export function MenuCollapse(props: MenuCollapseProps) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="flex flex-col gap-0.5">
      <Button
        className="w-full justify-start font-medium gap-3"
        size="sm"
        variant={visible ? 'tertiary' : 'ghost'}
        onClick={() => setVisible(!visible)}
      >
        {props.icon && (
          <span className=" text-foreground/50">
            {props.icon}
          </span>
        )}
        <span className="flex-1 text-start">{props.label}</span>
        <ChevronRight
          className={clsx(
            'size-3 text-foreground/50',
            'transition-transform duration-100',
            visible && 'rotate-90',
          )}
        />

      </Button>
      <CollapseTransition visible={visible}>
        <div className="flex flex-col [&>.item]:-mt-px [&>.item]:border-l [&>.item]:ml-2 [&>.item]:pl-1">
          {props.children}
        </div>
      </CollapseTransition>
    </div>
  )
}
