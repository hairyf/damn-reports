'use client'

import type { ButtonProps } from '@heroui/react'
import type { PropsWithChildren, ReactNode } from 'react'
import { TriangleRightFill } from '@gravity-ui/icons'
import { Button } from '@heroui/react'
import { clsx } from 'clsx'
import { AnimatePresence, motion } from 'motion/react'

export function Menu(props: PropsWithChildren) {
  return (
    <menu className="flex flex-col gap-2 px-1.5">
      {props.children}
    </menu>
  )
}

Menu.Item = MenuItem
Menu.Group = MenuGroup

export interface MenuItemProps extends Omit<ButtonProps, 'children'> {
  prefix?: ReactNode
  suffix?: ReactNode
  children?: ReactNode
  to?: string
}

function MenuItem(props: MenuItemProps) {
  return (
    <Button className="w-full justify-between rounded-md">
      <div className="flex gap-2">
        {props.prefix}
        {props.children}
      </div>
      {props.suffix}
    </Button>
  )
}

export interface MenuGroupProps {
  suffix?: ReactNode
  label?: string
  children?: ReactNode
  defaultOpen?: boolean
}

function MenuGroup(props: MenuGroupProps) {
  const [expanded, setExpanded] = useState(props.defaultOpen)
  return (
    <div className="flex flex-col">
      <Button
        variant={expanded ? 'tertiary' : 'ghost'}
        className="w-full justify-between rounded-md"
        size="sm"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex gap-2 items-center">
          <span className="text-xs">{props.label}</span>
        </div>
        <div className="flex gap-2">
          {props.suffix}
          <TriangleRightFill
            className={clsx('size-2 pt-px transition-transform duration-300', {
              'rotate-90': expanded,
            })}
          />
        </div>
      </Button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col gap-1 mt-1">
              {props.children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
