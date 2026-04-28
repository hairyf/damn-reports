'use client'

import { ChevronDown, Gear, LayoutSideContent } from '@gravity-ui/icons'
import { Avatar, Button, Dropdown, Label } from '@heroui/react'
import { storeToState } from 'valtio-define'

export function Topbar() {
  const [_, setAsideShow] = storeToState(store.app, 'asideShow')
  return (
    <div className="p-1.5 flex justify-between">
      <Dropdown>
        <Button aria-label="Menu" className="rounded-md px-2" variant="ghost">
          <Avatar className="rounded-md size-6">
            <Avatar.Image alt="Diana" src="/diana.png" />
            <Avatar.Fallback>Diana</Avatar.Fallback>
          </Avatar>
          <div className="text-sm">Diana</div>
          <ChevronDown />
        </Button>
        <Dropdown.Popover className="rounded-md! shadow-none!">
          <Dropdown.Menu className="rotate-0">
            <Dropdown.Item className="rounded-md" id="new-file" textValue="New file">
              <Label>New file</Label>
            </Dropdown.Item>
            <Dropdown.Item className="rounded-md" id="copy-link" textValue="Copy link">
              <Label>Copy link</Label>
            </Dropdown.Item>
            <Dropdown.Item className="rounded-md" id="edit-file" textValue="Edit file">
              <Label>Edit file</Label>
            </Dropdown.Item>
            <Dropdown.Item className="rounded-md" id="delete-file" textValue="Delete file" variant="danger">
              <Label>Delete file</Label>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
      <div className="flex gap-0.5">
        <Button className="rounded-md" size="sm" variant="ghost" isIconOnly onClick={() => setAsideShow(false)}>
          <LayoutSideContent />
        </Button>
        <Button className="rounded-md" size="sm" variant="ghost" isIconOnly>
          <Gear />
        </Button>
      </div>
    </div>
  )
}
