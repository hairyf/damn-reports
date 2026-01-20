'use client'

import { Button, Card, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react'
import { Icon } from '@iconify/react'

interface TrendCardProps {
  title: string
  value: string
}

export function TrendCard({ title, value }: TrendCardProps) {
  return (
    <Card shadow="none">
      <div className="flex p-4">
        <div className="flex flex-col gap-y-2">
          <dt className="text-small text-default-500 font-medium">{title}</dt>
          <dd className="text-default-700 text-2xl font-semibold">{value}</dd>
        </div>
        <Dropdown
          classNames={{
            content: 'min-w-[120px]',
          }}
          placement="bottom-end"
        >
          <DropdownTrigger>
            <Button
              isIconOnly
              className="absolute top-2 right-2 w-auto rounded-full"
              size="sm"
              variant="light"
            >
              <Icon height={16} icon="solar:menu-dots-bold" width={16} />
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            itemClasses={{
              title: 'text-tiny',
            }}
            variant="flat"
          >
            <DropdownItem key="view-details">View Details</DropdownItem>
            <DropdownItem key="export-data">Export Data</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </Card>
  )
}
