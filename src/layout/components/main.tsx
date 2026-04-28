'use client'

import type { PropsWithChildren } from 'react'
import { LayoutSideContent } from '@gravity-ui/icons'
import { Button, Card } from '@heroui/react'
import { storeToState } from 'valtio-define'

export function Main(props: PropsWithChildren) {
  const [asideShow, setAsideShow] = storeToState(store.app, 'asideShow')
  return (
    <main className="flex-1 p-2 pl-0 ">
      <Card className="h-full rounded-md relative">
        <If cond={!asideShow}>
          <Button className="rounded-md absolute top-2 left-2 z-10" size="sm" variant="ghost" isIconOnly onClick={() => setAsideShow(true)}>
            <LayoutSideContent />
          </Button>
        </If>
        {props.children}
      </Card>
    </main>
  )
}
