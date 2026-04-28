import type { PropsWithChildren, ReactNode } from 'react'
import { Aside } from './components/aside'
import { Main } from './components/main'

export interface DefaultLayoutProps extends PropsWithChildren {
  sidebar?: ReactNode
}

export function DefaultLayout({ children, sidebar }: DefaultLayoutProps) {
  return (
    <div className="bg-background-secondary min-h-screen flex">
      <Aside>
        {sidebar}
      </Aside>
      <Main>
        {children}
      </Main>
    </div>
  )
}
